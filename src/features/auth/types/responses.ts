import z from "zod";
import {
    loginResponseSchema,
    meResponseSchema,
    refreshResponseSchema,
    registerResponseSchema,
} from "../schemas/responses";

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export type MeResponse = z.infer<typeof meResponseSchema>;

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
