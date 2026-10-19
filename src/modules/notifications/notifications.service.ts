import { db } from "@/db/index.js";
import { notificationChannels, type ChannelConfig } from "@/db/schema.js";
import { and, count, desc, eq } from "drizzle-orm";
import { toPublicChannel } from "./notifications.mapper.js";
import { AppError, ConflictError, NotFoundError, ValidationError } from "@/shared/errors/index.js";
import {
    channelConfigSchemas,
    type CreateChannelDto,
    type UpdateChannelDto
} from "./notifications.schema.js";
import { formatZodIssues } from "@/shared/lib/format-zod-issues.js";
import { buildPage, type PaginationQuery } from "@/shared/lib/pagination.js";

const MAX_CHANNELS_PER_USER = 20;

export class NotificationsService {
    static async getAllByUserId(userId: number, pagination: PaginationQuery) {
        const where = eq(notificationChannels.userId, userId);

        const [rows, [totalRow]] = await Promise.all([
            db
                .select()
                .from(notificationChannels)
                .where(where)
                .orderBy(desc(notificationChannels.createdAt), desc(notificationChannels.id))
                .limit(pagination.limit)
                .offset(pagination.offset),
            db.select({ total: count() }).from(notificationChannels).where(where)
        ]);

        return buildPage(
            rows.map((row) => toPublicChannel(row)),
            totalRow?.total ?? 0,
            pagination
        );
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
        const [totalRow] = await db
            .select({ total: count() })
            .from(notificationChannels)
            .where(eq(notificationChannels.userId, userId));

        if ((totalRow?.total ?? 0) >= MAX_CHANNELS_PER_USER) {
            throw new ConflictError(`Channel limit reached (${MAX_CHANNELS_PER_USER})`);
        }

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

        const changes: { name?: string; config?: ChannelConfig } = {};

        if (data.name !== undefined) {
            changes.name = data.name;
        }
        if (data.config !== undefined) {
            const parsed = channelConfigSchemas[channel.type].safeParse({
                ...channel.config,
                ...data.config
            });
            if (!parsed.success) {
                throw new ValidationError("Invalid channel config", formatZodIssues(parsed.error));
            }
            changes.config = parsed.data;
        }

        const [updated] = await db
            .update(notificationChannels)
            .set(changes)
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
