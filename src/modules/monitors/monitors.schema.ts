import { MONITOR_STATUSES } from "@/db/schema.js";
import { paginationQuerySchema } from "@/shared/lib/pagination.js";
import z from "zod";

export const createMonitorSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    url: z.url("Invalid URL format"),
    intervalSeconds: z.number().int().min(10).max(86400).default(60), //max 24h
    timeoutMs: z.number().int().min(1000).max(30000).default(5000),
    failureThreshold: z.number().int().min(1).max(10).default(1),
    isActive: z.boolean().default(true)
});

export const updateMonitorSchema = createMonitorSchema.required().partial();

export type CreateMonitorDto = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorDto = z.infer<typeof updateMonitorSchema>;

export const monitorIdParamSchema = z.object({
    id: z.coerce.number().int().positive()
});

export const monitorChannelParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
    channelId: z.coerce.number().int().positive()
});

export const channelMessageSchema = z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500)
    .nullable();

export const attachChannelSchema = z.object({
    message: channelMessageSchema.default(null),
    isEnabled: z.boolean().default(true)
});

export const updateMonitorChannelSchema = z.object({
    message: channelMessageSchema.optional(),
    isEnabled: z.boolean().optional()
});

export type AttachChannelDto = z.infer<typeof attachChannelSchema>;
export type UpdateMonitorChannelDto = z.infer<typeof updateMonitorChannelSchema>;

export const listMonitorsQuerySchema = paginationQuerySchema.extend({
    q: z
        .string()
        .trim()
        .max(100)
        .optional()
        .transform((value) => value || undefined),
    status: z.enum(MONITOR_STATUSES).optional(),
    isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional()
});

export type ListMonitorsQuery = z.infer<typeof listMonitorsQuerySchema>;
