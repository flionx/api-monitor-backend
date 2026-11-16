/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;
const caCert = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}
if (isProduction && !caCert) {
    throw new Error("DATABASE_CA_CERT is not set");
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
        ssl: isProduction ? { rejectUnauthorized: true, ca: caCert } : false
    }
});
