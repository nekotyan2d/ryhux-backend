import fastify from "fastify";
import "dotenv/config";
import { env } from "./env";
import fastifyAutoload from "@fastify/autoload";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const app = fastify();

const __dirname = import.meta.dirname;

await app.register(fastifySwagger, {
    openapi: {
        openapi: "3.0.0",
        info: {
            title: "Ryhux API",
            version: "1.0.0",
        },
        servers: [{ url: `http://localhost:${env.PORT}`, description: "Local development server" }],
        tags: [{ name: "auth", description: "Authentication related endpoints" }],
    },
});

await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
});

await app.register(fastifyAutoload, {
    dir: `${__dirname}/routes`,
});

const PORT = env.PORT;

app.listen({ port: PORT }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server is running at ${addr}`);
});

await app.ready();
app.swagger();
