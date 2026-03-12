import z from "zod";

export const tokenPairSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    access_token_expires_in: z.number(),
    refresh_token_expires_in: z.number(),
});
