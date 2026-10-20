import { Router } from "express";
import { MonitorsController } from "./monitors.controller.js";
import {
    attachChannelSchema,
    createMonitorSchema,
    listMonitorsQuerySchema,
    monitorChannelParamsSchema,
    monitorIdParamSchema,
    updateMonitorChannelSchema,
    updateMonitorSchema
} from "./monitors.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";
import { validate } from "@/shared/middleware/validate.js";
import { validateParams } from "@/shared/middleware/validateParams.js";
import { MonitorChannelsController } from "./monitor-channels.controller.js";
import { validateQuery } from "@/shared/middleware/validateQuery.js";
import { chartQuerySchema, statsQuerySchema } from "../metrics/metrics.schema.js";
import { MetricsController } from "../metrics/metrics.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(listMonitorsQuerySchema), MonitorsController.getAll);
router.get("/summary", MetricsController.getSummary);
router.get("/:id", validateParams(monitorIdParamSchema), MonitorsController.getById);
router.post("/", validate(createMonitorSchema), MonitorsController.create);
router.patch(
    "/:id",
    validateParams(monitorIdParamSchema),
    validate(updateMonitorSchema),
    MonitorsController.update
);
router.delete("/:id", validateParams(monitorIdParamSchema), MonitorsController.delete);

// channels
router.get("/:id/channels", validateParams(monitorIdParamSchema), MonitorChannelsController.getAll);
router.put(
    "/:id/channels/:channelId",
    validateParams(monitorChannelParamsSchema),
    validate(attachChannelSchema),
    MonitorChannelsController.attach
);
router.patch(
    "/:id/channels/:channelId",
    validateParams(monitorChannelParamsSchema),
    validate(updateMonitorChannelSchema),
    MonitorChannelsController.update
);
router.delete(
    "/:id/channels/:channelId",
    validateParams(monitorChannelParamsSchema),
    MonitorChannelsController.detach
);

// metrics
router.get(
    "/:id/stats",
    validateParams(monitorIdParamSchema),
    validateQuery(statsQuerySchema),
    MetricsController.getStats
);
router.get(
    "/:id/chart",
    validateParams(monitorIdParamSchema),
    validateQuery(chartQuerySchema),
    MetricsController.getChart
);
router.get(
    "/:id/overview",
    validateParams(monitorIdParamSchema),
    validateQuery(chartQuerySchema),
    MetricsController.getOverview
);

export { router as monitorRoutes };
