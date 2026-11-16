import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

async function runMigrations() {
    console.log("[DB] Running migrations...");
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("[DB] Migrations applied successfully");
    } catch (error) {
        console.error("[DB] Migration failed:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigrations();
