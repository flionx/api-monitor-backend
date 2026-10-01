import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../errors/index.js";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message, details: err.details });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Unhandled error: ", err);
    return res.status(500).json({ error: "Internal server error" });
}
