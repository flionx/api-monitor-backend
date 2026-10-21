import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../errors/index.js";

const handler = () => {
    throw new TooManyRequestsError("Too many attempts, please try again later");
};

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler
});
