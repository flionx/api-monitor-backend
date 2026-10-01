import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);

export { router as authRoutes }