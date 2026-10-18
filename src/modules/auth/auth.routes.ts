import { Router } from "express";
import { validate } from "@/shared/middleware/validate.js";
import { AuthController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.me);

export { router as authRoutes };
