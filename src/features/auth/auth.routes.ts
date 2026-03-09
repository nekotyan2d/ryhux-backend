import { FastifyPluginAsync } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import {
    loginController,
    logoutController,
    meController,
    refreshController,
    registerController,
} from "./auth.controller";
import { authenticateAccessToken } from "./auth.middleware";
import {
    logoutBodySchema,
    logoutResponseSchema,
    refreshBodySchema,
    refreshResponseSchema,
    meResponseSchema,
    registerBodySchema,
    registerResponseSchema,
    loginBodySchema,
    loginResponseSchema,
    errorResponseSchema,
} from "./auth.schemas";

/**
 * Auth routes plugin
 * Registers authentication endpoints with validation and OpenAPI documentation
 */
const authRoutes: FastifyPluginAsync = async (app) => {
    const api = app.withTypeProvider<FastifyZodOpenApiTypeProvider>();

    // Register endpoint
    api.post(
        "/register",
        {
            schema: {
                operationId: "authRegister",
                tags: ["auth"],
                description: "Register a new user account",
                summary: "Register a new user",
                body: registerBodySchema,
                response: {
                    201: registerResponseSchema,
                    409: errorResponseSchema,
                    400: errorResponseSchema,
                },
            },
        },
        registerController,
    );

    // Login endpoint
    api.post(
        "/login",
        {
            schema: {
                operationId: "authLogin",
                tags: ["auth"],
                description: "Login with email and password",
                summary: "User login",
                body: loginBodySchema,
                response: {
                    200: loginResponseSchema,
                    401: errorResponseSchema,
                    400: errorResponseSchema,
                },
            },
        },
        loginController,
    );

    // Refresh endpoint
    api.post(
        "/refresh",
        {
            schema: {
                operationId: "authRefresh",
                tags: ["auth"],
                description: "Rotate refresh token and issue a new access/refresh token pair",
                summary: "Refresh tokens",
                body: refreshBodySchema,
                response: {
                    200: refreshResponseSchema,
                    401: errorResponseSchema,
                    400: errorResponseSchema,
                },
            },
        },
        refreshController,
    );

    // Logout endpoint
    api.post(
        "/logout",
        {
            schema: {
                operationId: "authLogout",
                tags: ["auth"],
                description: "Revoke refresh token and log out session",
                summary: "User logout",
                body: logoutBodySchema,
                response: {
                    204: logoutResponseSchema,
                    400: errorResponseSchema,
                },
            },
        },
        logoutController,
    );

    // Protected profile endpoint
    api.get(
        "/me",
        {
            preHandler: authenticateAccessToken,
            schema: {
                operationId: "authMe",
                tags: ["auth"],
                description: "Get the current authenticated user",
                summary: "Current user profile",
                security: [{ bearerAuth: [] }],
                response: {
                    200: meResponseSchema,
                    401: errorResponseSchema,
                },
            },
        },
        meController,
    );
};

export default authRoutes;
