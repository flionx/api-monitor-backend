import { db } from "@/db/index.js";
import { renderMessage, type MonitorCheck } from "./notifications.template.js";
import { monitorChannels, notificationChannels } from "@/db/schema.js";
import { and, eq } from "drizzle-orm";
import { sendViaChannel } from "./providers/index.js";
import type { NotificationChannel } from "./notifications.mapper.js";

export class NotifyService {
    static async dispatch(check: MonitorCheck) {
        const targets = await db
            .select({
                message: monitorChannels.message,
                type: notificationChannels.type,
                config: notificationChannels.config
            })
            .from(monitorChannels)
            .innerJoin(notificationChannels, eq(monitorChannels.channelId, notificationChannels.id))
            .where(
                and(
                    eq(monitorChannels.monitorId, check.monitor.id),
                    eq(monitorChannels.isEnabled, true)
                )
            );

        if (targets.length === 0) return;

        const results = await Promise.allSettled(
            targets.map((target) => sendViaChannel(target, renderMessage(target.message, check)))
        );

        results.forEach((result, i) => {
            if (result.status === "rejected") {
                const reason =
                    result.reason instanceof Error ? result.reason.message : "unkown error";
                console.log(
                    `[Notify] ${targets[i]?.type} delivery failed for monitor ${check.monitor.id}: ${reason}`
                );
            }
        });
    }

    static async sendTest(channel: NotificationChannel) {
        await sendViaChannel(channel, "Test notification from API Monitor");
    }
}
