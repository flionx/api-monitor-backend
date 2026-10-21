import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";
import type { Request, Response } from "express";
import type { ChecksQuery } from "./checks.schema.js";
import { ChecksService } from "./checks.service.js";

export class ChecksController {
    static async getHistory(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const monitorId = Number(req.params.id);
        const query = res.locals.query as ChecksQuery;

        const page = await ChecksService.getHistory(userId, monitorId, query);
        res.status(200).json(page);
    }
}
