import express, { type Response } from "express";
import cookieParser from "cookie-parser";
import { env } from "./shared/config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { monitorRoutes } from "./modules/monitors/monitors.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { WorkerService } from "./worker/worker.service.js";
import { pool } from "./db/index.js";

const PORT = env.PORT;

const app = express();

if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_, res: Response) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/notification-channels", notificationRoutes);

app.use(errorHandler);

if (env.WORKER_ENABLED) {
    WorkerService.start();
}

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

    await WorkerService.stop();

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
