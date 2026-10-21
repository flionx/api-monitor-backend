import type { Request, Response } from "express";
import { NotificationsService } from "./notifications.service.js";
import { NotifyService } from "./notify.service.js";
import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";
import type { CreateChannelDto } from "./notifications.schema.js";
import type { PaginationQuery } from "@/shared/lib/pagination.js";

export class NotificationsController {
    static async getAll(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const pagination = res.locals.query as PaginationQuery;
        const page = await NotificationsService.getAllByUserId(userId, pagination);
        res.status(200).json(page);
    }

    static async create(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const channel = await NotificationsService.create(userId, req.body as CreateChannelDto);
        res.status(201).json(channel);
    }

    static async update(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const channelId = Number(req.params.id);

        const channel = await NotificationsService.update(
            userId,
            channelId,
            req.body as CreateChannelDto
        );
        res.status(200).json(channel);
    }

    static async delete(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const channelId = Number(req.params.id);

        await NotificationsService.delete(userId, channelId);
        res.status(200).json({ message: "Channel deleted successfully" });
    }

    static async test(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const channelId = Number(req.params.id);

        const channel = await NotificationsService.getOwned(userId, channelId);
        await NotifyService.sendTest(channel);

        res.status(200).json({ message: "Test notification sent" });
    }
}
