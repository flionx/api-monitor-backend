import z from "zod";
import "dotenv/config";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string(),
    WORKER_ENABLED: z.stringbool().default(true),
    CORS_ORIGINS: z
        .string()
        .default("http://localhost:5173")
        .transform((value) =>
            value
                .split(",")
                .map((origin) => origin.trim())
                .filter(Boolean)
        )
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error(`invalid env variables:\n${parsed.error}`);
}

export const env = parsed.data;
