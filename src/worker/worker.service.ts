import { and, eq, isNull, or, sql } from "drizzle-orm";
import { checks, monitors } from "@/db/schema.js";
import { db } from "@/db/index.js";
import pLimit from "p-limit";
import { CheckerService } from "./checker.service.js";

export class WorkerService {
    private static timer: NodeJS.Timeout | null = null;
    private static isRunning = false;
    private static currentTick: Promise<void> | null = null;
    private static readonly CONCURRENCY_LIMIT = 10;

    static start(intervalMs = 10000) {
        if (this.timer) return;

        console.log(`[Worker] Started with interval ${intervalMs}ms`);

        this.timer = setInterval(async () => {
            if (this.isRunning) return;
            this.isRunning = true;

            this.currentTick = this.tick().finally(() => {
                this.isRunning = false;
                this.currentTick = null;
            });
        }, intervalMs);
    }

    static async tick() {
        try {
            const monitorsToCheck = await db
                .select({
                    id: monitors.id,
                    name: monitors.name,
                    url: monitors.url,
                    timeoutMs: monitors.timeoutMs,
                    status: monitors.status,
                    consecutiveFailures: monitors.consecutiveFailures,
                    failureThreshold: monitors.failureThreshold
                })
                .from(monitors)
                .leftJoin(
                    db
                        .select({
                            monitorId: checks.monitorId,
                            checkedAt: sql`MAX(${checks.checkedAt})`.as("last_checked_at")
                        })
                        .from(checks)
                        .groupBy(checks.monitorId)
                        .as("last_checks"),
                    sql`${monitors.id} = last_checks.monitor_id`
                )
                .where(
                    and(
                        eq(monitors.isActive, true),
                        or(
                            sql`last_checks.last_checked_at IS NULL`,
                            sql`NOW() - last_checks.last_checked_at >= ${monitors.intervalSeconds} * INTERVAL '1 second'`
                        )
                    )
                );
            if (monitorsToCheck.length === 0) return;

            console.log(`[Worker] Checking ${monitorsToCheck.length} monitors...`);

            const limit = pLimit(this.CONCURRENCY_LIMIT);

            await Promise.all(
                monitorsToCheck.map((monitor) => limit(() => CheckerService.checkOne(monitor)))
            );
        } catch (error) {
            console.error("[Worker] Error during execution: ", error);
        }
    }

    static async stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.currentTick;
        await CheckerService.drainNotifications();
        console.log("[Worker] Stopped");
    }
}
