import { db } from "@/db";
import { userSubscriptionTable } from "@/db/schema";
import { ConflictError } from "@/errors";
import { and, eq } from "drizzle-orm";

export async function followUser(followerId: bigint, followingId: bigint): Promise<void> {
    const result = await db
        .insert(userSubscriptionTable)
        .values({
            follower_id: followerId,
            following_id: followingId,
        })
        .onConflictDoNothing();

    if (result.rowCount === 0) {
        throw new ConflictError("You are already following this user");
    }
}

export async function unfollowUser(followerId: bigint, followingId: bigint): Promise<void> {
    const result = await db
        .delete(userSubscriptionTable)
        .where(
            and(eq(userSubscriptionTable.follower_id, followerId), eq(userSubscriptionTable.following_id, followingId)),
        );

    if (result.rowCount === 0) {
        throw new ConflictError("You are not following this user");
    }
}
