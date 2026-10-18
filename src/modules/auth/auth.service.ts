import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { AppError, ConflictError, UnauthorizedError } from "@/shared/errors/index.js";
import { env } from "@/shared/config/env.js";
import { SESSION_TTL_SECONDS } from "@/shared/lib/auth-cookie.js";

const JWT_SECRET = env.JWT_SECRET;

export class AuthService {
    static async register(emailRaw: string, passwordRaw: string) {
        const email = emailRaw.toLowerCase().trim();

        const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUsers.length > 0) {
            throw new ConflictError("User with this email already exists");
        }

        const passwordHash = await bcrypt.hash(passwordRaw, 10);

        try {
            const [newUser] = await db.insert(users).values({ email, passwordHash }).returning({
                id: users.id,
                email: users.email,
                createdAt: users.createdAt
            });

            if (!newUser) {
                throw new AppError("Failed to create user", 500);
            }
            return this.buildAuthResponse(newUser);
        } catch (err: any) {
            if (err.code === "23505") {
                throw new ConflictError("User with this email already exists");
            }
            throw err;
        }
    }

    static async login(emailRaw: string, passwordRaw: string) {
        const email = emailRaw.toLowerCase().trim();

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(passwordRaw, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        return this.buildAuthResponse(user);
    }

    static async getById(userId: number) {
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                createdAt: users.createdAt
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            throw new UnauthorizedError("User no longer exists");
        }
        return user;
    }

    private static generateToken(userId: number) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
    }

    private static buildAuthResponse(user: { id: number; email: string; createdAt: Date }) {
        const token = this.generateToken(user.id);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt
            }
        };
    }
}
