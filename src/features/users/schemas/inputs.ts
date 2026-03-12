import z from "zod";

export const getUserByIdParamsSchema = z.object({
    id: z.uuidv7(),
});

export const followUnfollowUserParamsSchema = z.object({
    id: z.uuidv7(),
});
