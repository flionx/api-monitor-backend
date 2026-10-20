import z from "zod";
import "dotenv/config";

const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        PORT: z.coerce.number().int().positive().default(5000),
        DATABASE_URL: z.url(),
        JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
        WORKER_ENABLED: z.stringbool().default(true),
        ALLOW_PRIVATE_TARGETS: z.stringbool().default(false),
        CORS_ORIGINS: z
            .string()
            .default("http://localhost:5173")
            .transform((value) =>
                value
                    .split(",")
                    .map((origin) => origin.trim())
                    .filter(Boolean)
            )
    })
    .refine((e) => !(e.NODE_ENV === "production" && e.ALLOW_PRIVATE_TARGETS), {
        message: "ALLOW_PRIVATE_TARGETS must not be enabled in production"
    });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error(`invalid env variables:\n${parsed.error}`);
}

export const env = parsed.data;
