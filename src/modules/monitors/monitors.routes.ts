import { Router } from "express";
import { MonitorsController } from "./monitors.controller.js";
import {
    createMonitorSchema,
    monitorIdParamSchema,
    updateMonitorSchema
} from "./monitors.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";
import { validate } from "@/shared/middleware/validate.js";
import { validateParams } from "@/shared/middleware/validateParams.js";

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

export { router as monitorRoutes };
