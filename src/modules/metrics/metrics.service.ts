import { checks } from "@/db/schema.js";
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

export class MerticsService {
    static async getStats(userId: number, monitorId: number, range: MetricsRange) {
        await MonitorsService.getOwned(userId, monitorId);

        const [aggRows, lastRows] = await Promise.all([
            db
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
                .where(and(eq(checks.monitorId, monitorId), withinLast(RANGE_SECONDS[range]))),

            db
                .select({ isUp: checks.isUp, checkedAt: checks.checkedAt })
                .from(checks)
                .where(eq(checks.monitorId, monitorId))
                .orderBy(desc(checks.checkedAt))
                .limit(1)
        ]);

        const agg = aggRows[0];
        if (!agg) {
            throw new AppError("Failed to compute stats", 500);
        }

        const last = lastRows[0];

        return {
            range,
            currentStatus: last ? (last.isUp ? "up" : "down") : "unknown",
            lastCheckedAt: last ? last.checkedAt : null,
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
}
