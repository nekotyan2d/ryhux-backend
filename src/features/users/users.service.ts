import { findUserByPublicId, getBaseUserByPublicId, getFullUserByPublicId } from "@/repository/user";
import { BasePublicUser, PublicUser } from "@/types/users";
import {
    followUser as followUserInternal,
    unfollowUser as unfollowUserInternal,
} from "@/features/users/users.repository";
import { ForbiddenError } from "@/errors";

export async function getUserById(publicId: string): Promise<BasePublicUser> {
    return await getBaseUserByPublicId(publicId);
}

export async function getFullUserById(publicId: string): Promise<PublicUser> {
    return await getFullUserByPublicId(publicId);
}

export async function followUser(followerPublicId: string, followingPublicId: string): Promise<void> {
    if (followerPublicId === followingPublicId) {
        throw new ForbiddenError("You cannot follow yourself");
    }

    const followerUser = await findUserByPublicId(followerPublicId);
    const followingUser = await findUserByPublicId(followingPublicId);

    await followUserInternal(followerUser.user_id, followingUser.user_id);
}

export async function unfollowUser(followerPublicId: string, followingPublicId: string): Promise<void> {
    if (followerPublicId === followingPublicId) {
        throw new ForbiddenError("You cannot follow yourself");
    }

    const followerUser = await findUserByPublicId(followerPublicId);
    const followingUser = await findUserByPublicId(followingPublicId);

    await unfollowUserInternal(followerUser.user_id, followingUser.user_id);
}
