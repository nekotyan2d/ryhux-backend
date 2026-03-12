import z from "zod";
import { tokenPairSchema } from "./entities";
import { basePublicUserSchema } from "@/schemas/users";

export const registerResponseSchema = z.object({
    user: basePublicUserSchema,
});

export const loginResponseSchema = z.object({
    user: basePublicUserSchema,
    tokens: tokenPairSchema,
});

export const refreshResponseSchema = z.object({
    user: basePublicUserSchema,
    tokens: tokenPairSchema,
});

export const meResponseSchema = z.object({
    user: basePublicUserSchema,
});

export const logoutResponseSchema = z.null();
