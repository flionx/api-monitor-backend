import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/index.js";

const JWT_SECRET = env.JWT_SECRET;

interface MyJwtPayload extends JwtPayload {
    userId: number;
    email: string;
}

const isMyJwtPayload = (obj: unknown): obj is MyJwtPayload =>
    obj !== null &&
    typeof obj === "object" &&
    "userId" in obj &&
    "email" in obj &&
    typeof obj.userId === "number" &&
    typeof obj.email === "string";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const match = authHeader?.match(/^Bearer (.+)$/);

    if (!match) {
        return next(new UnauthorizedError("Authentication token is required"));
    }

    const token = match[1]!;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!isMyJwtPayload(decoded)) {
            return next(new UnauthorizedError("Invalid or expired token"));
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch {
        return next(new UnauthorizedError("Invalid or expired token"));
    }
}
