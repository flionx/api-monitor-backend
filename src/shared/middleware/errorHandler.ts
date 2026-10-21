import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../errors/index.js";

const BODY_PARSER_ERRORS: Record<string, { status: number; message: string }> = {
    "entity.parse.failed": { status: 400, message: "Malformed JSON body" },
    "entity.too.large": { status: 413, message: "Request body too large" }
};

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message, details: err.details });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    const bodyError = BODY_PARSER_ERRORS[(err as { type?: string }).type ?? ""];
    if (bodyError) {
        return res.status(bodyError.status).json({ error: bodyError.message });
    }

    console.error("Unhandled error: ", err);
    return res.status(500).json({ error: "Internal server error" });
}
