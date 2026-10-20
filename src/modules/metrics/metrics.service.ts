import { checks, monitors } from "@/db/schema.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { RANGE_SECONDS, type MetricsRange } from "./metrics.schema.js";
import { MonitorsService } from "../monitors/monitors.service.js";
import { db } from "@/db/index.js";
import { AppError } from "@/shared/errors/index.js";

const withinLast = (seconds: number) =>
    sql`${checks.checkedAt} >= NOW() - ${seconds}::int * INTERVAL '1 second'`;

function toPercent(part: number, total: number) {
    return total === 0 ? null : Math.round((part / total) * 10000) / 100;
}

type Monitor = typeof monitors.$inferSelect;

export class MerticsService {
    static async getStats(userId: number, monitorId: number, range: MetricsRange) {
        const monitor = await MonitorsService.getOwned(userId, monitorId);
        return this.computeStats(monitor, range);
    }

    static async getChart(userId: number, monitorId: number, range: MetricsRange, points: number) {
        const monitor = await MonitorsService.getOwned(userId, monitorId);
        return this.computeChart(monitor, range, points);
    }

    static async getSummary(userId: number) {
        const [[counts], [uptime], downMonitors] = await Promise.all([
            db
                .select({
                    total: sql<number>`count(*)::int`,
                    up: sql<number>`(count(*) FILTER (WHERE ${monitors.isActive} AND ${monitors.status} = 'up'))::int`,
                    down: sql<number>`(count(*) FILTER (WHERE ${monitors.isActive} AND ${monitors.status} = 'down'))::int`,
                    pending: sql<number>`(count(*) FILTER (WHERE ${monitors.isActive} AND ${monitors.status} = 'unknown'))::int`,
                    paused: sql<number>`(count(*) FILTER (WHERE NOT ${monitors.isActive}))::int`
                })
                .from(monitors)
                .where(eq(monitors.userId, userId)),
            db
                .select({
                    total: sql<number>`count(*)::int`,
                    successfull: sql<number>`(count(*) FILTER (WHERE ${checks.isUp}))::int`
                })
                .from(checks)
                .innerJoin(monitors, eq(checks.monitorId, monitors.id))
                .where(
                    and(
                        eq(monitors.userId, userId),
                        eq(monitors.isActive, true),
                        withinLast(RANGE_SECONDS["24h"])
                    )
                ),
            db
                .select({
                    id: monitors.id,
                    name: monitors.name,
                    url: monitors.url,
                    lastCheckedAt: monitors.lastCheckedAt,
                    lastErrorMessage: monitors.lastErrorMessage
                })
                .from(monitors)
                .where(
                    and(
                        eq(monitors.userId, userId),
                        eq(monitors.isActive, true),
                        eq(monitors.status, "down")
                    )
                )
                .orderBy(desc(monitors.lastCheckedAt))
                .limit(10)
        ]);

        if (!counts || !uptime) {
            throw new AppError("Failed to compute summary", 500);
        }

        return {
            counts,
            uptime24h: {
                percent: toPercent(uptime.successfull, uptime.total),
                totalChecks: uptime.total,
                failedChecks: uptime.total - uptime.successfull
            },
            downMonitors
        };
    }

    private static async computeStats(monitor: Monitor, range: MetricsRange) {
        const [agg] = await db
            .select({
                total: sql<number>`count(*)::int`,
                successfull: sql<number>`(count(*) FILTER (WHERE ${checks.isUp}))::int`,
                avgMs: sql<
                    number | null
                >`round(avg(${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`,
                minMs: sql<
                    number | null
                >`(min(${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`,
                maxMs: sql<
                    number | null
                >`(max(${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`,
                p95Ms: sql<
                    number | null
                >`round(percentile_cont(0.95) WITHIN GROUP (ORDER BY ${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`
            })
            .from(checks)
            .where(and(eq(checks.monitorId, monitor.id), withinLast(RANGE_SECONDS[range])));

        if (!agg) {
            throw new AppError("Failed to compute stats", 500);
        }

        return {
            range,
            currentStatus: monitor.status,
            lastCheckedAt: monitor.lastCheckedAt,
            uptimePercent: toPercent(agg.successfull, agg.total),
            totalChecks: agg.total,
            failedChecks: agg.total - agg.successfull,
            responseTime: {
                avgMs: agg.avgMs,
                minMs: agg.minMs,
                maxMs: agg.maxMs,
                p95ms: agg.p95Ms
            }
        };
    }

    private static async computeChart(monitor: Monitor, range: MetricsRange, points: number) {
        const rangeSeconds = RANGE_SECONDS[range];
        const bucketSeconds = Math.ceil(rangeSeconds / points);

        const bucket = sql`date_bin(
            ${bucketSeconds}::int * INTERVAL '1 second',
            ${checks.checkedAt},
            TIMESTAMPTZ '2000-01-01 00:00:00+00'
        )`.mapWith(checks.checkedAt);

        const rows = await db
            .select({
                timestamp: bucket,
                totalChecks: sql<number>`count(*)::int`,
                failedChecks: sql<number>`(count(*) FILTER (WHERE NOT ${checks.isUp}))::int`,
                avgResponseTimeMs: sql<
                    number | null
                >`round(avg(${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`,
                maxResponseTimeMs: sql<
                    number | null
                >`(max(${checks.responseTimeMs}) FILTER (WHERE ${checks.isUp}))::int`
            })
            .from(checks)
            .where(and(eq(checks.monitorId, monitor.id), withinLast(rangeSeconds)))
            .groupBy(sql`1`)
            .orderBy(sql`1`);

        return {
            range,
            bucketSeconds,
            points: rows.map((row) => ({
                timestamp: row.timestamp,
                totalChecks: row.totalChecks,
                failedChecks: row.failedChecks,
                avgResponseTimeMs: row.avgResponseTimeMs,
                maxResponseTimeMs: row.maxResponseTimeMs,
                uptimePercent: toPercent(row.totalChecks - row.failedChecks, row.totalChecks)
            }))
        };
    }
}
