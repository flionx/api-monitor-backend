import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/index.js";
import { AUTH_COOKIE_NAME } from "../lib/auth-cookie.js";

const JWT_SECRET = env.JWT_SECRET;

interface MyJwtPayload extends JwtPayload {
    userId: number;
}

const isMyJwtPayload = (obj: unknown): obj is MyJwtPayload =>
    obj !== null && typeof obj === "object" && "userId" in obj && typeof obj.userId === "number";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];

    if (typeof token !== "string" || token === "") {
        return next(new UnauthorizedError("Authentication token is required"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
        if (!isMyJwtPayload(decoded)) {
            return next(new UnauthorizedError("Invalid or expired token"));
        }

        req.user = {
            userId: decoded.userId
        };
        next();
    } catch {
        return next(new UnauthorizedError("Invalid or expired token"));
    }
}
