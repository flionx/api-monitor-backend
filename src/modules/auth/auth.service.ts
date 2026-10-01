import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
}

export class AuthService {
    static async register(emailRaw: string, passwordRaw: string) {
        const email = emailRaw.toLowerCase().trim();

        const existingUsers = await db
            .select().from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUsers.length > 0) {
            throw new Error('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(passwordRaw, 10);

        try {
            const [newUser] = await db
                .insert(users)
                .values({ email, passwordHash }).returning({
                    id: users.id,
                    email: users.email,
                    createdAt: users.createdAt
                });

            if (!newUser) {
                throw new Error('Failed to create user');
            }
            return this.buildAuthResponse(newUser);
        } catch (err: any) {
            if (err.code === '23505') {
                throw new Error('User with this email already exists');
            } 
            throw err;
        }
    };

    static async login(emailRaw: string, passwordRaw: string) {
        const email = emailRaw.toLowerCase().trim();

        const [user] = await db
            .select().from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(passwordRaw, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        return this.buildAuthResponse(user);
    };

    private static generateToken(userId: number, email: string) {
        return jwt.sign(
            { userId, email },
            JWT_SECRET!,
            { expiresIn: '24h' }
        )
    };

    private static buildAuthResponse(user: { id: number, email: string, createdAt: Date }) {
        const token = this.generateToken(user.id, user.email);
        return { token, user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
        } }
    }
};