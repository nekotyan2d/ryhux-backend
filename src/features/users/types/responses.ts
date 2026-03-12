import z from "zod";
import {
    followUnfollowUserResponseSchema,
    getFullUserByIdResponseSchema,
    getUserByIdResponseSchema,
} from "../schemas/responses";

export type GetUserResponse = z.infer<typeof getUserByIdResponseSchema>;

export type GetFullUserResponse = z.infer<typeof getFullUserByIdResponseSchema>;

export type FollowUnfollowUserResponse = z.infer<typeof followUnfollowUserResponseSchema>;
