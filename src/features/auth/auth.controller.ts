import { FastifyReply, FastifyRequest } from "fastify";
import { login, logout, refresh, register } from "./auth.service";
import { toUserPublic } from "./auth.repository";
import type {
    LoginBody,
    LoginResponse,
    MeResponse,
    RefreshBody,
    RefreshResponse,
    RegisterBody,
    RegisterResponse,
} from "./auth.types";
import { UnauthorizedError } from "../../errors";

/**
 * Register controller - handles user registration requests
 */
export async function registerController(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply,
): Promise<RegisterResponse> {
    const user = await register(request.body);

    reply.code(201);
    return { user };
}

/**
 * Login controller - handles user login requests
 */
export async function loginController(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
): Promise<LoginResponse> {
    const userAgent = request.headers["user-agent"] ?? "unknown";
    const result = await login(request.body, userAgent);

    reply.code(200);
    return result;
}

/**
 * Refresh controller - rotates refresh token and returns new token pair
 */
export async function refreshController(
    request: FastifyRequest<{ Body: RefreshBody }>,
    reply: FastifyReply,
): Promise<RefreshResponse> {
    const userAgent = request.headers["user-agent"] ?? "unknown";
    const result = await refresh(request.body, userAgent);

    reply.code(200);
    return result;
}

/**
 * Logout controller - revokes refresh token
 */
export async function logoutController(
    request: FastifyRequest<{ Body: RefreshBody }>,
    reply: FastifyReply,
): Promise<void> {
    await logout(request.body);

    reply.code(204);
    return;
}

/**
 * Me controller - returns the authenticated user
 */
export async function meController(request: FastifyRequest, reply: FastifyReply): Promise<MeResponse> {
    if (!request.auth?.userId) {
        throw new UnauthorizedError("Missing authentication context");
    }

    const user = await toUserPublic(request.auth.userId);

    reply.code(200);
    return { user };
}
