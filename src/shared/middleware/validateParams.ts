import type { NextFunction, Request, Response } from "express";
import type z from "zod";
import { ValidationError } from "../errors/index.js";
import { formatZodIssues } from "../lib/format-zod-issues.js";

export function validateParams(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return next(new ValidationError("Validation failed", formatZodIssues(result.error)));
        }
        req.params = result.data as typeof req.params;
        next();
    };
}
