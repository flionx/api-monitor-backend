import { type Request, type Response } from "express";
import { AuthService } from "./auth.service.js";
import { setAuthCookie } from "@/shared/lib/auth-cookie.js";

export class AuthController {
    static async register(req: Request, res: Response) {
        const { email, password } = req.body;
        const { token, user } = await AuthService.register(email, password);
        setAuthCookie(res, token);
        return res.status(201).json(user);
    }

    static async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const { token, user } = await AuthService.login(email, password);
        setAuthCookie(res, token);
        return res.status(200).json(user);
    }
}
