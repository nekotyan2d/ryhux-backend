import { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "@/errors";
import { verifyAccessToken } from "@/features/auth/auth.service";

export async function authenticateAccessToken(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);

    console.log("Authenticated user ID:", payload.userId);

    request.auth = {
        userId: payload.userId,
    };
}
