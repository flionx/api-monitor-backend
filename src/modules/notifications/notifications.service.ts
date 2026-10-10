import { db } from "@/db/index.js";
import { notificationChannels } from "@/db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { toPublicChannel } from "./notifications.mapper.js";
import { AppError, NotFoundError, ValidationError } from "@/shared/errors/index.js";
import {
    channelConfigSchemas,
    type CreateChannelDto,
    type UpdateChannelDto
} from "./notifications.schema.js";
import { formatZodIssues } from "@/shared/lib/format-zod-issues.js";

export class NotificationsService {
    static async getAllByUserId(userId: number) {
        const list = await db
            .select()
            .from(notificationChannels)
            .where(eq(notificationChannels.userId, userId))
            .orderBy(desc(notificationChannels.createdAt));

        return list.map(toPublicChannel);
    }

    /** Returns the raw row(with secrets). For internal use only or with toPublicChannel */
    static async getOwned(userId: number, channelId: number) {
        const [channel] = await db
            .select()
            .from(notificationChannels)
            .where(
                and(eq(notificationChannels.userId, userId), eq(notificationChannels.id, channelId))
            );

        if (!channel) {
            throw new NotFoundError("Channel not found or access denied");
        }
        return channel;
    }

    static async create(userId: number, data: CreateChannelDto) {
        const [newChannel] = await db
            .insert(notificationChannels)
            .values({ ...data, userId })
            .returning();

        if (!newChannel) {
            throw new AppError("Failed to create channel", 500);
        }
        return toPublicChannel(newChannel);
    }

    static async update(userId: number, channelId: number, data: UpdateChannelDto) {
        const channel = await this.getOwned(userId, channelId);

        const parsed = channelConfigSchemas[channel.type].safeParse(data.config);
        if (!parsed.success) {
            throw new ValidationError("Invalid channel config", formatZodIssues(parsed.error));
        }

        const [updated] = await db
            .update(notificationChannels)
            .set({ config: parsed.data })
            .where(
                and(eq(notificationChannels.userId, userId), eq(notificationChannels.id, channelId))
            )
            .returning();

        if (!updated) {
            throw new NotFoundError("Channel not found or access denied");
        }
        return toPublicChannel(updated);
    }

    static async delete(userId: number, channelId: number) {
        const [deleted] = await db
            .delete(notificationChannels)
            .where(
                and(eq(notificationChannels.userId, userId), eq(notificationChannels.id, channelId))
            )
            .returning({ id: notificationChannels.id });

        if (!deleted) {
            throw new NotFoundError("Channel not found or access denied");
        }
    }
}
