import express, { type Request, type Response } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { env } from "./shared/config/env.js";
import { monitorRoutes } from "./modules/monitors/monitors.routes.js";
import { WorkerService } from "./worker/worker.service.js";
import { pool } from "./db/index.js";

const PORT = env.PORT;

const app = express();
app.use(express.json());

app.get("/health", (_, res: Response) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/monitors", monitorRoutes);

app.use(errorHandler);

// WorkerService.start();

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let shuttingDown = false;
const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[Shutdown] Received ${signal}, shutting down...`);

    const forceExitTimer = setTimeout(() => {
        console.error("[Shutdown] Force exit after timeout");
        process.exit(1);
    }, 10000).unref();

    WorkerService.stop();

    server.close(() => {
        console.log("[Shutdown] HTTP server closed");
    });

    server.closeIdleConnections();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await pool.end();

    clearTimeout(forceExitTimer);
    console.log("[Shutdown] Complete");
    process.exit(0);
};

["SIGTERM", "SIGINT"].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
});
