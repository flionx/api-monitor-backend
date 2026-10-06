import z from "zod";
import "dotenv/config";

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error(`invalid env variables:\n${parsed.error}`);
}

export const env = parsed.data;
