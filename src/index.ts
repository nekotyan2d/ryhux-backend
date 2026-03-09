import fastify from "fastify";
import "dotenv/config";
import { env } from "./env";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
    serializerCompiler,
    validatorCompiler,
    fastifyZodOpenApiPlugin,
    fastifyZodOpenApiTransform,
    fastifyZodOpenApiTransformObject,
} from "fastify-zod-openapi";
import { AppError } from "./errors";
import { cleanupExpiredRefreshTokens } from "./features/auth/auth.service";
import { authRoutes } from "./features/auth";

const app = fastify();

await app.register(fastifyZodOpenApiPlugin);
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifySwagger, {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "Ryhux API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        servers: [{ url: `http://localhost:${env.PORT}`, description: "Local development server" }],
        tags: [{ name: "auth", description: "Authentication related endpoints" }],
    },
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
});

await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
});

await app.register(authRoutes, { prefix: "/auth" });

app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            message: error.message,
        });
    }

    if (error && typeof error === "object" && "validation" in error) {
        return reply.status(400).send({
            message: "Validation error",
            details: error.validation,
        });
    }

    request.log.error(error);
    return reply.status(500).send({
        message: "Internal server error",
    });
});

const PORT = env.PORT;

if (env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES > 0) {
    const intervalMs = env.REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES * 60 * 1000;

    // Periodically remove expired refresh tokens to keep table size bounded.
    const cleanupTimer = setInterval(async () => {
        try {
            const deletedCount = await cleanupExpiredRefreshTokens();
            if (deletedCount > 0) {
                app.log.info({ deletedCount }, "Deleted expired refresh tokens");
            }
        } catch (error) {
            app.log.error(error, "Failed to cleanup expired refresh tokens");
        }
    }, intervalMs);

    cleanupTimer.unref();
}

app.listen({ port: PORT }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server is running at ${addr}`);
});

await app.ready();
app.swagger();
