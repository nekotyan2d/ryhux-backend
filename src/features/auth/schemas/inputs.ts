import z from "zod";

export const registerBodySchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    nick: z.string().min(3, "Nick must be at least 3 characters").max(20, "Nick must be at most 20 characters"),
});

export const loginBodySchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string(),
});

export const refreshBodySchema = z.object({
    refresh_token: z.string().min(1, "Refresh token is required"),
});

export const logoutBodySchema = z.object({
    refresh_token: z.string().min(1, "Refresh token is required"),
});
