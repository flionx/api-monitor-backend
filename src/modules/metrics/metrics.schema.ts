import z from "zod";

export const RANGES = ["1h", "24h", "7d", "30d"] as const;
export type MetricsRange = (typeof RANGES)[number];

export const RANGE_SECONDS: Record<MetricsRange, number> = {
    "1h": 3600,
    "24h": 86400,
    "7d": 604800,
    "30d": 2592000
};

export const statsQuerySchema = z.object({
    range: z.enum(RANGES).default("24h")
});

export const chartQuerySchema = statsQuerySchema.extend({
    points: z.coerce.number().int().min(10).max(200).default(60)
});

export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type ChartQuery = z.infer<typeof chartQuerySchema>;
