import z from "zod";
import { loginBodySchema, logoutBodySchema, refreshBodySchema, registerBodySchema } from "../schemas/inputs";

export type RegisterBody = z.infer<typeof registerBodySchema>;

export type LoginBody = z.infer<typeof loginBodySchema>;

export type RefreshBody = z.infer<typeof refreshBodySchema>;

export type LogoutBody = z.infer<typeof logoutBodySchema>;
