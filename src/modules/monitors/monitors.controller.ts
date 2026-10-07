import { type Request, type Response } from "express";
import { MonitorsService } from "./monitors.service.js";
import { ValidationError } from "@/shared/errors/index.js";
import type { CreateMonitorDto, UpdateMonitorDto } from "./monitors.schema.js";
import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";

export class MonitorController {
    static async getAll(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const list = await MonitorsService.getAllByUserId(userId);
        res.status(200).json(list);
    }

    static async create(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitor = await MonitorsService.create(userId, req.body as CreateMonitorDto);
        res.status(201).json(monitor);
    }

    static async update(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);

        if (isNaN(monitorId) || monitorId <= 0) {
            throw new ValidationError("Invalid monitor ID");
        }

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

        if (isNaN(monitorId) || monitorId <= 0) {
            throw new ValidationError("Invalid monitor ID");
        }

        await MonitorsService.delete(userId, monitorId);
        res.status(200).json({ message: "Monitor deleted successfully" });
    }
}
