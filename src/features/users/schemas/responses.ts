import z from "zod";
import { basePublicUserSchema, publicUserSchema } from "@/schemas/users";

export const getUserByIdResponseSchema = z.object({
    user: basePublicUserSchema,
});

export const getFullUserByIdResponseSchema = z.object({
    user: publicUserSchema,
});

export const followUnfollowUserResponseSchema = z.null();
