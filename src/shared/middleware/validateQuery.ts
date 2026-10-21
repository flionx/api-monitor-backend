import type z from "zod";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/index.js";
import { formatZodIssues } from "../lib/format-zod-issues.js";

export function validateQuery(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return next(new ValidationError("Validation failed", formatZodIssues(result.error)));
        }
        res.locals.query = result.data;
        next();
    };
}
