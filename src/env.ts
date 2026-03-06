import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8000),
    DATABASE_URL: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env: EnvConfig = envSchema.parse(process.env);

export function getEnv(): EnvConfig {
    return env;
}
