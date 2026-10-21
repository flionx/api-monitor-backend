import type { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/index.js";
import { formatZodIssues } from "../lib/format-zod-issues.js";

export function validate(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(new ValidationError("Validation failed", formatZodIssues(result.error)));
        }
        req.body = result.data;
        next();
    };
}
