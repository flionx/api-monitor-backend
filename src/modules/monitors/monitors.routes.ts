import { Router } from "express";
import { MonitorsController } from "./monitors.controller.js";
import {
    attachChannelSchema,
    createMonitorSchema,
    monitorChannelParamsSchema,
    monitorIdParamSchema,
    updateMonitorChannelSchema,
    updateMonitorSchema
} from "./monitors.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";
import { validate } from "@/shared/middleware/validate.js";
import { validateParams } from "@/shared/middleware/validateParams.js";
import { MonitorChannelsController } from "./monitor-channels.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", MonitorsController.getAll);
router.post("/", validate(createMonitorSchema), MonitorsController.create);
router.patch(
    "/:id",
    validateParams(monitorIdParamSchema),
    validate(updateMonitorSchema),
    MonitorsController.update
);
router.delete("/:id", validateParams(monitorIdParamSchema), MonitorsController.delete);

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

export { router as monitorRoutes };
