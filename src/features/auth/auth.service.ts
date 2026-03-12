import bcrypt from "bcrypt";
import { ConflictError, UnauthorizedError } from "@/errors";
import {
    createAuthUser,
    createRefreshTokenRecord,
    deleteExpiredRefreshTokens,
    deleteRefreshTokenByHash,
    findRefreshTokenByHash,
} from "./auth.repository";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/env";
import crypto from "crypto";
import { v7 as uuidv7 } from "uuid";
import { findUserByEmail, findUserById, getBaseUserById } from "@/repository/user";
import { LoginResponse, RefreshResponse } from "./types/responses";
import { LoginBody, LogoutBody, RefreshBody, RegisterBody } from "./types/inputs";
import { BasePublicUser } from "@/types/users";
import { TokenPair } from "./types/entities";

const SALT_ROUNDS = 10;

type AccessPayload = JwtPayload & {
    typ: "access";
    userId?: string;
};

type RefreshPayload = JwtPayload & {
    typ: "refresh";
    jti: string;
    userId?: string;
};

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

async function issueTokensForUser(
    userId: bigint,
    publicId: string,
    userAgent: string,
): Promise<LoginResponse["tokens"]> {
    const refreshToken = signRefreshToken(publicId);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await createRefreshTokenRecord({
        hash: refreshTokenHash,
        userId,
        expiresAt: getRefreshTokenExpiryDate(),
        userAgent,
    });

    return buildTokenPair(publicId, refreshToken);
}

export async function register(data: RegisterBody): Promise<BasePublicUser> {
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
        throw new ConflictError("Email already registered");
    }

    const passwordHash = await hashPassword(data.password);

    const userId = await createAuthUser({
        email: data.email,
        passwordHash,
        nick: data.nick,
    });

    return getBaseUserById(userId);
}

export async function login(data: LoginBody, userAgent: string): Promise<LoginResponse> {
    // Find user by email
    const credentials = await findUserByEmail(data.email);
    if (!credentials) {
        throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isValid = await verifyPassword(data.password, credentials.password_hash);
    if (!isValid) {
        throw new UnauthorizedError("Invalid credentials");
    }

    const user = await getBaseUserById(credentials.user_id);
    const tokens = await issueTokensForUser(credentials.user_id, user.user_id, userAgent);

    return {
        user,
        tokens,
    };
}

/**
 * Rotate refresh token and return a new token pair
 */
export async function refresh(data: RefreshBody, userAgent: string): Promise<RefreshResponse> {
    const payload = verifyRefreshToken(data.refresh_token);

    const hash = hashRefreshToken(data.refresh_token);
    const existingToken = await findRefreshTokenByHash(hash);

    if (!existingToken) {
        throw new UnauthorizedError("Refresh token revoked or not found");
    }

    const user = await findUserById(existingToken.user_id);
    if (user.public_id !== payload.userId) {
        await deleteRefreshTokenByHash(hash);
        throw new UnauthorizedError("Refresh token is invalid");
    }

    if (existingToken.expires_at.getTime() <= Date.now()) {
        await deleteRefreshTokenByHash(hash);
        throw new UnauthorizedError("Refresh token expired");
    }

    await deleteRefreshTokenByHash(hash);
    const tokens = await issueTokensForUser(existingToken.user_id, user.public_id, userAgent);

    return {
        user: await getBaseUserById(existingToken.user_id),
        tokens,
    };
}

/**
 * Revoke a refresh token (logout)
 */
export async function logout(data: LogoutBody): Promise<void> {
    const hash = hashRefreshToken(data.refresh_token);
    await deleteRefreshTokenByHash(hash);
}

/**
 * Remove expired refresh tokens
 */
export async function cleanupExpiredRefreshTokens(): Promise<number> {
    return deleteExpiredRefreshTokens();
}

function parseTokenPayload<T extends JwtPayload>(tokenPayload: string | JwtPayload, message: string): T {
    if (typeof tokenPayload === "string") {
        throw new UnauthorizedError(message);
    }

    return tokenPayload as T;
}

export function hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(publicId: string): string {
    return jwt.sign(
        {
            typ: "access",
            userId: publicId,
        },
        env.ACCESS_TOKEN_SECRET,
        {
            subject: publicId,
            expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
        },
    );
}

export function signRefreshToken(publicId: string): string {
    return jwt.sign(
        {
            typ: "refresh",
            jti: uuidv7(),
            userId: publicId,
        },
        env.REFRESH_TOKEN_SECRET,
        {
            subject: publicId,
            expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
        },
    );
}

export function verifyAccessToken(token: string): { userId: string } {
    try {
        const payload = parseTokenPayload<AccessPayload>(
            jwt.verify(token, env.ACCESS_TOKEN_SECRET),
            "Invalid access token",
        );
        const userId = payload.userId ?? payload.sub;

        if (payload.typ !== "access" || !userId) {
            throw new UnauthorizedError("Invalid access token");
        }

        return {
            userId,
        };
    } catch {
        throw new UnauthorizedError("Invalid or expired access token");
    }
}

export function verifyRefreshToken(token: string): { userId: string; jti: string } {
    try {
        const payload = parseTokenPayload<RefreshPayload>(
            jwt.verify(token, env.REFRESH_TOKEN_SECRET),
            "Invalid refresh token",
        );
        const userId = payload.userId ?? payload.sub;

        if (payload.typ !== "refresh" || !userId || !payload.jti) {
            throw new UnauthorizedError("Invalid refresh token");
        }

        return {
            userId,
            jti: payload.jti,
        };
    } catch {
        throw new UnauthorizedError("Invalid or expired refresh token");
    }
}

export function buildTokenPair(publicId: string, refreshToken: string): TokenPair {
    const accessToken = signAccessToken(publicId);

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_expires_in: env.ACCESS_TOKEN_TTL_SECONDS,
        refresh_token_expires_in: env.REFRESH_TOKEN_TTL_SECONDS,
    };
}

export function getRefreshTokenExpiryDate(): Date {
    return new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
}
