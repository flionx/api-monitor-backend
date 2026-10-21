import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";
import type { Request, Response } from "express";
import { MonitorChannelsService } from "./monitor-channels.service.js";
import type { AttachChannelDto, UpdateMonitorChannelDto } from "./monitors.schema.js";

export class MonitorChannelsController {
    static async getAll(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const list = await MonitorChannelsService.getAll(userId, monitorId);
        res.status(200).json(list);
    }

    static async attach(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const channelId = Number(req.params.channelId);
        const link = await MonitorChannelsService.attach(
            userId,
            monitorId,
            channelId,
            req.body as AttachChannelDto
        );
        res.status(200).json(link);
    }

    static async update(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const channelId = Number(req.params.channelId);
        const link = await MonitorChannelsService.update(
            userId,
            monitorId,
            channelId,
            req.body as UpdateMonitorChannelDto
        );
        res.status(200).json(link);
    }

    static async detach(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const channelId = Number(req.params.channelId);
        await MonitorChannelsService.detach(userId, monitorId, channelId);
        res.status(200).json({ message: "Channel detached successfully" });
    }
}
