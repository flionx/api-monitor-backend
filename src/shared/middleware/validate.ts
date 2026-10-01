import type { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/index.js";

export function validate(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
            return next(new ValidationError('Validation failed', details));
        }
        req.body = result.data;
        next();
    }
}