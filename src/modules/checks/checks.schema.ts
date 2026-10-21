import z from "zod";

export const checksQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.coerce.number().int().positive().optional(),
    isUp: z.stringbool().optional()
});

export type ChecksQuery = z.infer<typeof checksQuerySchema>;
