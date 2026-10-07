import express, { type Request, type Response } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { env } from "./shared/config/env.js";
import { monitorRoutes } from "./modules/monitors/monitors.routes.js";

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
