import type { NextFunction, Request, Response } from "express";
import type z from "zod";
import { ValidationError } from "../errors/index.js";

export function validateParams(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const details = result.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message
            }));
            return next(new ValidationError("Validation failed", details));
        }
        req.params = result.data as typeof req.params;
        next();
    };
}
