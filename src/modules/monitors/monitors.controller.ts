import { type Request, type Response } from "express";
import { MonitorsService } from "./monitors.service.js";
import type { CreateMonitorDto, ListMonitorsQuery, UpdateMonitorDto } from "./monitors.schema.js";
import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";

export class MonitorsController {
    static async getAll(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const query = res.locals.query as ListMonitorsQuery;
        const page = await MonitorsService.getAllByUserId(userId, query);
        res.status(200).json(page);
    }

    static async getById(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const monitor = await MonitorsService.getOwned(userId, monitorId);
        res.status(200).json(monitor);
    }

    static async create(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitor = await MonitorsService.create(userId, req.body as CreateMonitorDto);
        res.status(201).json(monitor);
    }

    static async update(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);

        const monitor = await MonitorsService.update(
            userId,
            monitorId,
            req.body as UpdateMonitorDto
        );
        res.status(200).json(monitor);
    }

    static async delete(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);

        await MonitorsService.delete(userId, monitorId);
        res.status(200).json({ message: "Monitor deleted successfully" });
    }
}
