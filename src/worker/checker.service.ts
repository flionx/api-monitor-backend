import { db } from "@/db/index.js";
import { checks, monitors, type CheckErrorType, type MonitorStatus } from "@/db/schema.js";
import type { MonitorCheck } from "@/modules/notifications/notifications.template.js";
import { NotifyService } from "@/modules/notifications/notify.service.js";
import { desc, eq } from "drizzle-orm";
import { evaluateCheck } from "./evaluate-check.js";

interface MonitorToCheck {
    id: number;
    name: string;
    url: string;
    timeoutMs: number;
    status: MonitorStatus;
    consecutiveFailures: number;
    failureThreshold: number;
}

export class CheckerService {
    private static pendingNotifications = new Set<Promise<void>>();

    static async checkOne(monitor: MonitorToCheck) {
        const startTime = Date.now();
        let isUp = false;
        let statusCode: number | null = null;
        let errorMessage: string | null = null;
        let errorType: CheckErrorType | null = null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), monitor.timeoutMs);

        try {
            const response = await fetch(monitor.url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "User-Agent": "ApiMonitor/1.0 (+https://github.com/flionx/api-monitor-backend)"
                }
            });

            statusCode = response.status;
            isUp = response.ok;

            if (!isUp) {
                errorMessage = `HTTP Status ${statusCode}`;
                errorType = statusCode >= 500 ? "server_error" : "client_error";
            }
        } catch (err: any) {
            isUp = false;
            if (err.name === "AbortError") {
                errorMessage = `Request timed out after ${monitor.timeoutMs}ms`;
                errorType = "timeout";
            } else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
                errorMessage = `Network error: ${err.message}`;
                errorType = "connection";
            } else {
                errorMessage = err.message || "Unknown network error";
                errorType = "unknown";
            }
        } finally {
            clearTimeout(timeoutId);
        }

        const responseTimeMs = Date.now() - startTime;
        const next = evaluateCheck(monitor, isUp, monitor.failureThreshold);

        const checkedAt = await db.transaction(async (tx) => {
            const [saved] = await tx
                .insert(checks)
                .values({
                    monitorId: monitor.id,
                    statusCode,
                    responseTimeMs,
                    isUp,
                    errorMessage,
                    errorType
                })
                .returning({ checkedAt: checks.checkedAt });

            await tx
                .update(monitors)
                .set({
                    status: next.status,
                    consecutiveFailures: next.consecutiveFailures
                })
                .where(eq(monitors.id, monitor.id));

            return saved?.checkedAt ?? new Date();
        });

        if (!next.notify) return;

        this.notify({
            monitor: { id: monitor.id, name: monitor.name, url: monitor.url },
            isUp,
            statusCode,
            responseTimeMs,
            errorMessage,
            checkedAt,
            consecutiveFailures: next.consecutiveFailures
        });
    }

    private static notify(check: MonitorCheck) {
        const task: Promise<void> = NotifyService.dispatch(check)
            .catch((err) => {
                console.log(
                    `[Checker] Alert dispatch failed for monitor ${check.monitor.id}:`,
                    err
                );
            })
            .finally(() => {
                this.pendingNotifications.delete(task);
            });

        this.pendingNotifications.add(task);
    }

    // wait alerts for shutdown
    static async drainNotifications() {
        await Promise.allSettled([...this.pendingNotifications]);
    }
}
