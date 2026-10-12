import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { monitorChannels, monitors, notificationChannels } from "@/db/schema.js";
import { toPublicChannel } from "../notifications/notifications.mapper.js";
import { getTemplateWarnings } from "../notifications/notifications.template.js";
import type { AttachChannelDto, UpdateMonitorChannelDto } from "./monitors.schema.js";
import { AppError, NotFoundError, ValidationError } from "@/shared/errors/index.js";

type MonitorChannelLink = typeof monitorChannels.$inferSelect;

function toLinkResponse(link: MonitorChannelLink) {
    return {
        monitorId: link.monitorId,
        channelId: link.channelId,
        message: link.message,
        isEnabled: link.isEnabled,
        warnings: getTemplateWarnings(link.message)
    };
}

export class MonitorChannelsService {
    private static async assertMonitorOwned(userId: number, monitorId: number) {
        const [monitor] = await db
            .select({ id: monitors.id })
            .from(monitors)
            .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
            .limit(1);

        if (!monitor) {
            throw new NotFoundError("Monitor not found or access denied");
        }
    }

    private static async assertChannelOwned(userId: number, channelId: number) {
        const [monitor] = await db
            .select({ id: notificationChannels.id })
            .from(notificationChannels)
            .where(
                and(eq(notificationChannels.id, channelId), eq(notificationChannels.userId, userId))
            )
            .limit(1);

        if (!monitor) {
            throw new NotFoundError("Channel not found or access denied");
        }
    }

    static async getAll(userId: number, monitorId: number) {
        await this.assertMonitorOwned(userId, monitorId);

        const rows = await db
            .select({
                channel: notificationChannels,
                message: monitorChannels.message,
                isEnabled: monitorChannels.isEnabled
            })
            .from(monitorChannels)
            .innerJoin(notificationChannels, eq(monitorChannels.channelId, notificationChannels.id))
            .where(eq(monitorChannels.monitorId, monitorId));

        return rows.map((row) => ({
            channel: toPublicChannel(row.channel),
            message: row.message,
            isEnabled: row.isEnabled
        }));
    }

    static async attach(
        userId: number,
        monitorId: number,
        channelId: number,
        data: AttachChannelDto
    ) {
        await this.assertMonitorOwned(userId, monitorId);
        await this.assertChannelOwned(userId, channelId);

        const [link] = await db
            .insert(monitorChannels)
            .values({
                monitorId,
                channelId,
                ...data
            })
            .onConflictDoUpdate({
                target: [monitorChannels.monitorId, monitorChannels.channelId],
                set: data
            })
            .returning();
        if (!link) {
            throw new AppError("Failed to attach channel", 500);
        }

        return toLinkResponse(link);
    }

    static async update(
        userId: number,
        monitorId: number,
        channelId: number,
        data: UpdateMonitorChannelDto
    ) {
        if (Object.keys(data).length === 0) {
            throw new ValidationError("No fields provided to update");
        }
        await this.assertMonitorOwned(userId, monitorId);

        const [link] = await db
            .update(monitorChannels)
            .set(data)
            .where(
                and(
                    eq(monitorChannels.monitorId, monitorId),
                    eq(monitorChannels.channelId, channelId)
                )
            )
            .returning();

        if (!link) {
            throw new NotFoundError("Channel is not attached to this monitor");
        }
        return toLinkResponse(link);
    }

    static async detach(userId: number, monitorId: number, channelId: number) {
        await this.assertMonitorOwned(userId, monitorId);

        const [deleted] = await db
            .delete(monitorChannels)
            .where(
                and(
                    eq(monitorChannels.monitorId, monitorId),
                    eq(monitorChannels.channelId, channelId)
                )
            )
            .returning({ channelId: monitorChannels.channelId });

        if (!deleted) {
            throw new NotFoundError("Channel is not attached to this monitor");
        }
    }
}
