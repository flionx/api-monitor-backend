import { Router } from "express";
import { MonitorsController } from "./monitors.controller.js";
import { createMonitorSchema, updateMonitorSchema } from "./monitors.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";
import { validate } from "@/shared/middleware/validate.js";

const router = Router();

router.use(authenticate);

router.get("/", MonitorsController.getAll);
router.post("/", validate(createMonitorSchema), MonitorsController.create);
router.patch("/", validate(updateMonitorSchema), MonitorsController.update);
router.delete("/:id", MonitorsController.delete);

export { router as monitorRoutes };
