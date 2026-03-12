import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokenTable, usersTable, userCredentialsTable, userInfoTable } from "@/db/schema";
import { v7 as uuidv7 } from "uuid";
import { RefreshTokenRecord } from "./types/entities";

export async function createAuthUser(params: { email: string; passwordHash: string; nick: string }): Promise<bigint> {
    const { email, passwordHash, nick } = params;

    const userId = await db.transaction(async (tx) => {
        const [user] = await tx
            .insert(usersTable)
            .values({
                public_id: uuidv7(),
            })
            .returning({ userId: usersTable.user_id });

        if (!user) {
            throw new Error("Failed to create user");
        }

        await tx.insert(userCredentialsTable).values({
            user_id: user.userId,
            email,
            password_hash: passwordHash,
        });

        await tx.insert(userInfoTable).values({
            user_id: user.userId,
            nick,
        });

        return user.userId;
    });

    return userId;
}

/**
 * Persist refresh token hash for a user
 */
export async function createRefreshTokenRecord(params: {
    hash: string;
    userId: bigint;
    expiresAt: Date;
    userAgent: string;
}): Promise<void> {
    await db.insert(refreshTokenTable).values({
        hash: params.hash,
        user_id: params.userId,
        expires_at: params.expiresAt,
        user_agent: params.userAgent,
    });
}

/**
 * Find refresh token record by token hash
 */
export async function findRefreshTokenByHash(hash: string): Promise<RefreshTokenRecord | undefined> {
    const [result] = await db
        .select({
            hash: refreshTokenTable.hash,
            user_id: refreshTokenTable.user_id,
            expires_at: refreshTokenTable.expires_at,
        })
        .from(refreshTokenTable)
        .where(eq(refreshTokenTable.hash, hash))
        .limit(1);

    if (!result?.user_id) {
        return undefined;
    }

    return result;
}

/**
 * Delete refresh token record by token hash
 */
export async function deleteRefreshTokenByHash(hash: string): Promise<void> {
    await db.delete(refreshTokenTable).where(eq(refreshTokenTable.hash, hash));
}

/**
 * Delete all expired refresh tokens
 */
export async function deleteExpiredRefreshTokens(now = new Date()): Promise<number> {
    const deleted = await db
        .delete(refreshTokenTable)
        .where(lt(refreshTokenTable.expires_at, now))
        .returning({ hash: refreshTokenTable.hash });

    return deleted.length;
}
