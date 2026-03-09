import { z } from "zod";

// Request schemas
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
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutBodySchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

// Response schemas
export const userPublicSchema = z.object({
    user_id: z.string(),
    nick: z.string(),
    status: z.string().nullable().optional(),
});

export const registerResponseSchema = z.object({
    user: userPublicSchema,
});

export const tokenPairSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    access_token_expires_in: z.number(),
    refresh_token_expires_in: z.number(),
});

export const loginResponseSchema = z.object({
    user: userPublicSchema,
    tokens: tokenPairSchema,
});

export const refreshResponseSchema = z.object({
    user: userPublicSchema,
    tokens: tokenPairSchema,
});

export const meResponseSchema = z.object({
    user: userPublicSchema,
});

export const logoutResponseSchema = z.null();

// Error response schema
export const errorResponseSchema = z.object({
    message: z.string(),
});

// Type exports
export type RegisterBodyInput = z.infer<typeof registerBodySchema>;
export type LoginBodyInput = z.infer<typeof loginBodySchema>;
