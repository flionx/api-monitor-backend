import { type Request } from "express";
import { UnauthorizedError } from "../errors/index.js";

export function getAuthenticatedUser(req: Request) {
    if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
    }
    return req.user;
}
