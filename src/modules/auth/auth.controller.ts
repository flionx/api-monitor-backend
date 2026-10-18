import { type Request, type Response } from "express";
import { AuthService } from "./auth.service.js";
import { clearAuthCookie, setAuthCookie } from "@/shared/lib/auth-cookie.js";
import { getAuthenticatedUser } from "@/shared/lib/get-authenticated-user.js";

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

    static async logout(req: Request, res: Response) {
        clearAuthCookie(res);
        return res.status(200).json({ message: "Logged out successfully" });
    }

    static async me(req: Request, res: Response) {
        const { userId } = getAuthenticatedUser(req);
        const user = await AuthService.getById(userId);
        return res.status(200).json(user);
    }
}
