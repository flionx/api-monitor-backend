import z from "zod";

export const createMonitorSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    url: z.url("Invalid URL format"),
    intervalSeconds: z.number().int().min(10).max(86400).default(60), //max 24h
    timeoutMs: z.number().int().min(1000).max(30000).default(5000),
    isActive: z.boolean().default(true)
});

export const updateMonitorSchema = createMonitorSchema.required().partial();

export type CreateMonitorDto = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorDto = z.infer<typeof updateMonitorSchema>;
