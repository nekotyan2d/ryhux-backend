import { basePublicUserSchema, publicUserSchema, userSocialStatsSchema } from "@/schemas/users";
import z from "zod";

export type BasePublicUser = z.infer<typeof basePublicUserSchema>;

export type PublicUser = z.infer<typeof publicUserSchema>;

export type UserSocialStats = z.infer<typeof userSocialStatsSchema>;
