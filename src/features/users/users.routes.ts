import { FastifyPluginAsync } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import {
    followUserController,
    getFullUserByIdController,
    getUserByIdController,
    unfollowUserController,
} from "./users.controller";
import { followUnfollowUserParamsSchema, getUserByIdParamsSchema } from "./schemas/inputs";
import { FollowUnfollowUserParams } from "./types/inputs";
import {
    followUnfollowUserResponseSchema,
    getFullUserByIdResponseSchema,
    getUserByIdResponseSchema,
} from "./schemas/responses";
import { authenticateAccessToken } from "@/middleware/auth";

/**
 * Users routes plugin
 * Registers users endpoints with validation and OpenAPI documentation
 */
const usersRoutes: FastifyPluginAsync = async (app) => {
    const api = app.withTypeProvider<FastifyZodOpenApiTypeProvider>();

    api.get(
        "/:id",
        {
            schema: {
                operationId: "getUserById",
                tags: ["users"],
                description: "Get user information by ID",
                summary: "Get user by ID",
                params: getUserByIdParamsSchema,
                response: {
                    200: getUserByIdResponseSchema,
                },
            },
        },
        getUserByIdController,
    );

    api.get(
        "/:id/full",
        {
            schema: {
                operationId: "getFullUserById",
                tags: ["users"],
                description: "Get full user information by ID",
                summary: "Get full user by ID",
                params: getUserByIdParamsSchema,
                response: {
                    200: getFullUserByIdResponseSchema,
                },
            },
        },
        getFullUserByIdController,
    );

    api.post<{ Params: FollowUnfollowUserParams }>(
        "/follow/:id",
        {
            preHandler: authenticateAccessToken,
            schema: {
                operationId: "followUser",
                tags: ["users"],
                description: "Follow a user by ID",
                summary: "Follow user",
                params: followUnfollowUserParamsSchema,
                security: [{ bearerAuth: [] }],
                response: {
                    200: followUnfollowUserResponseSchema,
                },
            },
        },
        followUserController,
    );

    api.delete<{ Params: FollowUnfollowUserParams }>(
        "/unfollow/:id",
        {
            preHandler: authenticateAccessToken,
            schema: {
                operationId: "unfollowUser",
                tags: ["users"],
                description: "Unfollow a user by ID",
                summary: "Unfollow user",
                params: followUnfollowUserParamsSchema,
                security: [{ bearerAuth: [] }],
                response: {
                    200: followUnfollowUserResponseSchema,
                },
            },
        },
        unfollowUserController,
    );
};

export default usersRoutes;
