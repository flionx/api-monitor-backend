import { env } from "../config/env.js";
import { type Response } from "express";

export const AUTH_COOKIE_NAME = "token";
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

const baseOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
} as const;

export function setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
        ...baseOptions,
        maxAge: SESSION_TTL_SECONDS * 1000
    });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, baseOptions);
}
