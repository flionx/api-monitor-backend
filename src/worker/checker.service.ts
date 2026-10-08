import { db } from "@/db/index.js";
import { checks, type CheckErrorType } from "@/db/schema.js";

interface MonitorToCheck {
    id: number;
    url: string;
    timeoutMs: number;
}

export class CheckerService {
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

        await db.insert(checks).values({
            monitorId: monitor.id,
            statusCode,
            responseTimeMs,
            isUp,
            errorMessage,
            errorType
        });
    }
}
