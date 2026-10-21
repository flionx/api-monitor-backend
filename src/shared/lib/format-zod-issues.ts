import type z from "zod";

export function formatZodIssues(error: z.ZodError) {
    return error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message
    }));
}
