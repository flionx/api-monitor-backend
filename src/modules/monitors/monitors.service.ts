import { db } from "@/db/index.js";
import { monitors } from "@/db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import type { CreateMonitorDto, UpdateMonitorDto } from "./monitors.schema.js";
import { AppError, NotFoundError, ValidationError } from "@/shared/errors/index.js";

export class MonitorsService {
    static async getAllByUserId(userId: number) {
        return await db
            .select()
            .from(monitors)
            .where(eq(monitors.userId, userId))
            .orderBy(desc(monitors.createdAt));
    }

    static async getOwned(userId: number, monitorId: number) {
        const [monitor] = await db
            .select()
            .from(monitors)
            .where(and(eq(monitors.userId, userId), eq(monitors.id, monitorId)))
            .limit(1);

        if (!monitor) {
            throw new NotFoundError("Monitor not found or access denied");
        }
        return monitor;
    }

    static async create(userId: number, data: CreateMonitorDto) {
        const [newMonitor] = await db
            .insert(monitors)
            .values({
                ...data,
                userId
            })
            .returning();

        if (!newMonitor) {
            throw new AppError("Failed to create monitor", 500);
        }

        return newMonitor;
    }

    static async update(userId: number, monitorId: number, data: UpdateMonitorDto) {
        if (Object.keys(data).length === 0) {
            throw new ValidationError("No fields provided for update");
        }

        const [updatedMonitor] = await db
            .update(monitors)
            .set({
                ...data
            })
            .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
            .returning();

        if (!updatedMonitor) {
            throw new NotFoundError("Monitor not found or access denied");
        }

        return updatedMonitor;
    }

    static async delete(userId: number, monitorId: number) {
        const [deletedMonitor] = await db
            .delete(monitors)
            .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
            .returning({ id: monitors.id });

        if (!deletedMonitor) {
            throw new NotFoundError("Monitor not found or access denied");
        }
    }
}
