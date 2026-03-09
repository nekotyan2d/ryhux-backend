import { FastifyInstance } from "fastify";
import { authRoutes } from "../../features/auth";

/**
 * Autoload bridge for auth feature
 */
export default async function (app: FastifyInstance) {
    await app.register(authRoutes);
}
