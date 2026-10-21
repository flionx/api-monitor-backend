import { Router } from "express";
import { validate } from "@/shared/middleware/validate.js";
import { AuthController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { authenticate } from "@/shared/middleware/authenticate.js";
import { loginRateLimiter, registerRateLimiter } from "@/shared/middleware/rateLimit.js";

const router = Router();

router.post("/register", registerRateLimiter, validate(registerSchema), AuthController.register);
router.post("/login", loginRateLimiter, validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.me);

export { router as authRoutes };
