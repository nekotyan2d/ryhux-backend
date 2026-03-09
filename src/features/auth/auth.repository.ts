import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokenTable, usersTable, userCredentialsTable, userInfoTable } from "@/db/schema";
import type { RefreshTokenRecord, UserCredentials, UserInfo, User, UserPublic } from "./auth.types";
import { v7 as uuidv7 } from "uuid";

/**
 * Find user credentials by email
 */
export async function findUserByEmail(email: string): Promise<UserCredentials | undefined> {
    const [result] = await db
        .select({
            user_id: userCredentialsTable.user_id,
            email: userCredentialsTable.email,
            password_hash: userCredentialsTable.password_hash,
        })
        .from(userCredentialsTable)
        .where(eq(userCredentialsTable.email, email))
        .limit(1);

    return result;
}

/**
 * Get user info by user ID
 */
export async function getUserInfo(userId: bigint): Promise<UserInfo | undefined> {
    const [result] = await db
        .select({
            user_id: userInfoTable.user_id,
            nick: userInfoTable.nick,
            status: userInfoTable.status,
        })
        .from(userInfoTable)
        .where(eq(userInfoTable.user_id, userId))
        .limit(1);

    return result;
}

/**
 * Get user by user ID
 */
export async function getUserById(userId: bigint): Promise<User | undefined> {
    const [result] = await db
        .select({
            user_id: usersTable.user_id,
            public_id: usersTable.public_id,
        })
        .from(usersTable)
        .where(eq(usersTable.user_id, userId))
        .limit(1);

    return result;
}

/**
 * Convert database user data to public user format
 */
export async function toUserPublic(userId: bigint): Promise<UserPublic> {
    const user = await getUserById(userId);
    const userInfo = await getUserInfo(userId);

    if (!user || !userInfo) {
        throw new Error("User data not found");
    }

    if (!user.public_id) {
        throw new Error("User public ID not found");
    }

    return {
        user_id: user.public_id,
        nick: userInfo.nick,
        status: userInfo.status,
    };
}

/**
 * Create a complete user with credentials and info in a transaction
 */
export async function createAuthUser(params: { email: string; passwordHash: string; nick: string }): Promise<bigint> {
    const { email, passwordHash, nick } = params;

    // Drizzle transaction to ensure all-or-nothing behavior
    const userId = await db.transaction(async (tx) => {
        // 1. Create base user
        const [user] = await tx
            .insert(usersTable)
            .values({
                public_id: uuidv7(),
            })
            .returning({ userId: usersTable.user_id });

        if (!user) {
            throw new Error("Failed to create user");
        }

        // 2. Create credentials
        await tx.insert(userCredentialsTable).values({
            user_id: user.userId,
            email,
            password_hash: passwordHash,
        });

        // 3. Create user info
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
