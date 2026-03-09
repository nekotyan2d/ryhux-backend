import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(8000),
    DATABASE_URL: z.string(),
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 14),
    REFRESH_TOKEN_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().nonnegative().default(60),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env: EnvConfig = envSchema.parse(process.env);

export function getEnv(): EnvConfig {
    return env;
}
