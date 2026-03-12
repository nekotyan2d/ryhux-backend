import { FastifyReply, FastifyRequest } from "fastify";
import { followUser, getFullUserById, getUserById, unfollowUser } from "./users.service";
import { FollowUnfollowUserParams, GetUserParams } from "./types/inputs";
import { FollowUnfollowUserResponse, GetFullUserResponse, GetUserResponse } from "./types/responses";

export async function getUserByIdController(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply,
): Promise<GetUserResponse> {
    const user = await getUserById(request.params.id);
    reply.code(200);
    return {
        user,
    };
}

export async function getFullUserByIdController(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply,
): Promise<GetFullUserResponse> {
    const user = await getFullUserById(request.params.id);
    reply.code(200);
    return {
        user,
    };
}

export async function followUserController(
    request: FastifyRequest<{ Params: FollowUnfollowUserParams }>,
    reply: FastifyReply,
): Promise<FollowUnfollowUserResponse> {
    await followUser(request.auth!.userId, request.params.id);
    reply.code(200);
    return null;
}

export async function unfollowUserController(
    request: FastifyRequest<{ Params: FollowUnfollowUserParams }>,
    reply: FastifyReply,
): Promise<FollowUnfollowUserResponse> {
    await unfollowUser(request.auth!.userId, request.params.id);
    reply.code(200);
    return null;
}
