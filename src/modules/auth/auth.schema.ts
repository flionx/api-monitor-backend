import z, { email, string } from "zod";

export const registerSchema = z.object({
    email: email("Invalid email format"),
    password: string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
    email: email("Invalid email format"),
    password: string().min(1, "Password is required")
});
