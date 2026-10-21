import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { ForbiddenError } from "../errors/index.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    if (SAFE_METHODS.has(req.method) || !origin || env.CORS_ORIGINS.includes(origin)) {
        return next();
    }
    next(new ForbiddenError("Origin not allowed"));
}
