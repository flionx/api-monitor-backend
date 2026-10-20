import type { Request, Response } from "express";
import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";
import type { ChartQuery, StatsQuery } from "./metrics.schema.js";
import { MerticsService } from "./metrics.service.js";

export class MetricsController {
    static async getStats(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const { range } = res.locals.query as StatsQuery;

        const stats = await MerticsService.getStats(userId, monitorId, range);
        res.status(200).json(stats);
    }

    static async getChart(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const { range, points } = res.locals.query as ChartQuery;

        const chart = await MerticsService.getChart(userId, monitorId, range, points);
        res.status(200).json(chart);
    }

    static async getSummary(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const summary = await MerticsService.getSummary(userId);
        res.status(200).json(summary);
    }
}
