import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";
import { env } from "@/shared/config/env.js";

const isProduction = env.NODE_ENV === "production";

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: true, ca: env.DATABASE_CA_CERT } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("error", (err) => {
    console.error("[DB] Idle client error:", err.message);
});

export const db = drizzle(pool, { schema });
