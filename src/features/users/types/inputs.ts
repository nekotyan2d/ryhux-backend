import z from "zod";
import { followUnfollowUserParamsSchema, getUserByIdParamsSchema } from "../schemas/inputs";

export type GetUserParams = z.infer<typeof getUserByIdParamsSchema>;

export type FollowUnfollowUserParams = z.infer<typeof followUnfollowUserParamsSchema>;
