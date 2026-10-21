import { db } from "@/db/index.js";
import { monitors } from "@/db/schema.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import type { CreateMonitorDto, ListMonitorsQuery, UpdateMonitorDto } from "./monitors.schema.js";
import { AppError, NotFoundError, ValidationError } from "@/shared/errors/index.js";
import { buildPage } from "@/shared/lib/pagination.js";
import { escapeLike } from "@/shared/lib/escape-like.js";

export class MonitorsService {
    static async getAllByUserId(userId: number, query: ListMonitorsQuery) {
        const conditions: SQL[] = [eq(monitors.userId, userId)];

        if (query.q) {
            const pattern = `%${escapeLike(query.q)}%`;
            const search = or(ilike(monitors.name, pattern), ilike(monitors.url, pattern));
            if (search) conditions.push(search);
        }

        if (query.isActive !== undefined) {
            conditions.push(eq(monitors.isActive, query.isActive));
        }
        if (query.status) {
            conditions.push(eq(monitors.status, query.status));
        }

        const where = and(...conditions);

        const [rows, [totalRow]] = await Promise.all([
            db
                .select()
                .from(monitors)
                .where(where)
                .orderBy(desc(monitors.createdAt), desc(monitors.id))
                .limit(query.limit)
                .offset(query.offset),
            db.select({ total: count() }).from(monitors).where(where)
        ]);

        return buildPage(rows, totalRow?.total ?? 0, query);
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
