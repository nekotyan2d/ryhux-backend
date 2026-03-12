import z from "zod";
import { tokenPairSchema } from "../schemas/entities";
import { userCredentialsTable, usersTable } from "@/db/schema";

export type TokenPair = z.infer<typeof tokenPairSchema>;

export type UserCredentials = typeof userCredentialsTable.$inferSelect;

export type User = typeof usersTable.$inferSelect;

export type RefreshTokenRecord = {
    user_id: bigint;
    hash: string;
    expires_at: Date;
};
