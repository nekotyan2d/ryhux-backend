import { db } from "@/db";
import { userCredentialsTable, userInfoTable, usersTable, userSubscriptionTable } from "@/db/schema";
import { NotFoundError } from "@/errors";
import { User, UserCredentials } from "@/features/auth";
import { BasePublicUser, PublicUser, UserSocialStats } from "@/types/users";
import { and, count, eq, sql } from "drizzle-orm";
import { buildBasePublicUser, buildPublicUser } from "@/dto/users";

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

export async function findUserById(userId: bigint): Promise<User> {
    const [result] = await db
        .select({
            user_id: usersTable.user_id,
            public_id: usersTable.public_id,
        })
        .from(usersTable)
        .where(eq(usersTable.user_id, userId))
        .limit(1);

    if (!result) {
        throw new NotFoundError("User not found");
    }

    return result;
}

export async function findUserByPublicId(publicId: string): Promise<User> {
    const [result] = await db
        .select({
            user_id: usersTable.user_id,
            public_id: usersTable.public_id,
        })
        .from(usersTable)
        .where(eq(usersTable.public_id, publicId))
        .limit(1);

    if (!result) {
        throw new NotFoundError("User not found");
    }

    return result;
}

export async function getBaseUserById(userId: bigint): Promise<BasePublicUser> {
    const [result] = await db
        .select({
            user_id: usersTable.public_id,
            nick: userInfoTable.nick,
        })
        .from(usersTable)
        .where(eq(usersTable.user_id, userId))
        .innerJoin(userInfoTable, eq(usersTable.user_id, userInfoTable.user_id))
        .limit(1);

    if (!result) {
        throw new NotFoundError("User not found");
    }

    return buildBasePublicUser(result);
}

export async function getBaseUserByPublicId(publicId: string): Promise<BasePublicUser> {
    const [result] = await db
        .select({
            user_id: usersTable.public_id,
            nick: userInfoTable.nick,
        })
        .from(usersTable)
        .where(eq(usersTable.public_id, publicId))
        .innerJoin(userInfoTable, eq(usersTable.user_id, userInfoTable.user_id))
        .limit(1);

    if (!result) {
        throw new NotFoundError("User not found");
    }

    return buildBasePublicUser(result);
}

export async function getFullUserByPublicId(publicId: string): Promise<PublicUser> {
    const [result] = await db
        .select({
            internal_user_id: usersTable.user_id,
            user_id: usersTable.public_id,
            nick: userInfoTable.nick,
            status: userInfoTable.status,
        })
        .from(usersTable)
        .where(eq(usersTable.public_id, publicId))
        .innerJoin(userInfoTable, eq(usersTable.user_id, userInfoTable.user_id))
        .limit(1);

    if (!result) {
        throw new NotFoundError("User not found");
    }

    const stats = await getUserSocialStatsById(result.internal_user_id);

    return buildPublicUser(result, stats);
}

export async function getUserSocialStatsById(userId: bigint): Promise<UserSocialStats> {
    const followersRows = await db
        .select({ value: count() })
        .from(userSubscriptionTable)
        .where(eq(userSubscriptionTable.following_id, userId));

    const followingRows = await db
        .select({ value: count() })
        .from(userSubscriptionTable)
        .where(eq(userSubscriptionTable.follower_id, userId));

    const friendsRows = await db
        .select({ value: count() })
        .from(userSubscriptionTable)
        .where(
            and(
                eq(userSubscriptionTable.follower_id, userId),
                sql`exists (
                    select 1
                    from user_subscription reverse_subscription
                    where reverse_subscription.follower_id = ${userSubscriptionTable.following_id}
                      and reverse_subscription.following_id = ${userId}
                )`,
            ),
        );

    return {
        followers_count: Number(followersRows[0]?.value ?? 0),
        following_count: Number(followingRows[0]?.value ?? 0),
        friends_count: Number(friendsRows[0]?.value ?? 0),
    };
}
