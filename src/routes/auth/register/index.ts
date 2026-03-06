import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";

export default async function (app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            schema: {
                operationId: "auth-register",
                tags: ["auth"],
                description: "Register a new user",
            },
        },
        async (request, reply) => {
            return register(app, request, reply);
        },
    );
}

function register(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    return reply.status(201).send({ message: "User registered successfully" });
}
