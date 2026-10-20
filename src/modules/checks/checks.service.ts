import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { MonitorsService } from "../monitors/monitors.service.js";
import type { ChecksQuery } from "./checks.schema.js";
import { checks } from "@/db/schema.js";
import { db } from "@/db/index.js";

export class ChecksService {
    static async getHistory(userId: number, monitorId: number, query: ChecksQuery) {
        await MonitorsService.getOwned(userId, monitorId);

        const conditions: SQL[] = [eq(checks.monitorId, monitorId)];
        if (query.cursor !== undefined) {
            conditions.push(lt(checks.id, query.cursor));
        }
        if (query.isUp !== undefined) {
            conditions.push(eq(checks.isUp, query.isUp));
        }

        const rows = await db
            .select({
                id: checks.id,
                statusCode: checks.statusCode,
                responseTimeMs: checks.responseTimeMs,
                isUp: checks.isUp,
                errorType: checks.errorType,
                errorMessage: checks.errorMessage,
                checkedAt: checks.checkedAt
            })
            .from(checks)
            .where(and(...conditions))
            .orderBy(desc(checks.id))
            .limit(query.limit + 1);

        const hasMore = rows.length > query.limit;
        const data = hasMore ? rows.slice(0, query.limit) : rows;

        return {
            data,
            meta: {
                limit: query.limit,
                nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null
            }
        };
    }
}
