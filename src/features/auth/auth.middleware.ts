import { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../../errors";
import { verifyAccessToken } from "./auth.service";

export async function authenticateAccessToken(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing bearer token");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyAccessToken(token);

    request.auth = {
        userId: payload.userId,
    };
}
