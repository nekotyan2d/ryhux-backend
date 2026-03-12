import z from "zod";

export const basePublicUserSchema = z.object({
    user_id: z.string(),
    nick: z.string(),
});

export const userSocialStatsSchema = z.object({
    followers_count: z.number().int().nonnegative(),
    following_count: z.number().int().nonnegative(),
    friends_count: z.number().int().nonnegative(),
});

export const publicUserSchema = basePublicUserSchema
    .extend({
        status: z.string().nullable().optional(),
    })
    .extend(userSocialStatsSchema.shape);
