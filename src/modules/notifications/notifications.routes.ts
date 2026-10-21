import { authenticate } from "@/shared/middleware/authenticate.js";
import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";
import { validate } from "@/shared/middleware/validate.js";
import {
    channelIdParamSchema,
    createChannelSchema,
    updateChannelSchema
} from "./notifications.schema.js";
import { validateParams } from "@/shared/middleware/validateParams.js";
import { validateQuery } from "@/shared/middleware/validateQuery.js";
import { paginationQuerySchema } from "@/shared/lib/pagination.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(paginationQuerySchema), NotificationsController.getAll);
router.post("/", validate(createChannelSchema), NotificationsController.create);
router.patch(
    "/:id",
    validateParams(channelIdParamSchema),
    validate(updateChannelSchema),
    NotificationsController.update
);
router.delete("/:id", validateParams(channelIdParamSchema), NotificationsController.delete);
router.post("/:id/test", validateParams(channelIdParamSchema), NotificationsController.test);

export { router as notificationRoutes };
