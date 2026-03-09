import bcrypt from "bcrypt";
import { ConflictError, UnauthorizedError } from "../../errors";
import {
    createAuthUser,
    createRefreshTokenRecord,
    deleteExpiredRefreshTokens,
    deleteRefreshTokenByHash,
    findRefreshTokenByHash,
    findUserByEmail,
    getUserById,
    toUserPublic,
} from "./auth.repository";
import type {
    LoginBody,
    LoginResponse,
    LogoutBody,
    RefreshBody,
    RefreshResponse,
    RegisterBody,
    TokenPair,
    UserPublic,
} from "./auth.types";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../env";
import crypto from "crypto";
import { v7 as uuidv7 } from "uuid";

const SALT_ROUNDS = 10;

type AccessPayload = JwtPayload & {
    typ: "access";
};

type RefreshPayload = JwtPayload & {
    typ: "refresh";
    jti: string;
};

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

async function issueTokensForUser(userId: bigint, userAgent: string): Promise<LoginResponse["tokens"]> {
    const refreshToken = signRefreshToken(userId);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await createRefreshTokenRecord({
        hash: refreshTokenHash,
        userId,
        expiresAt: getRefreshTokenExpiryDate(),
        userAgent,
    });

    return buildTokenPair(userId, refreshToken);
}

/**
 * Register a new user
 */
export async function register(data: RegisterBody): Promise<UserPublic> {
    // Check if email already exists
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
        throw new ConflictError("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user with credentials and info
    const userId = await createAuthUser({
        email: data.email,
        passwordHash,
        nick: data.nick,
    });

    // Return public user data
    return toUserPublic(userId);
}

/**
 * Login user with email and password
 */
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

    const user = await toUserPublic(credentials.user_id);
    const tokens = await issueTokensForUser(credentials.user_id, userAgent);

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

    if (existingToken.user_id !== payload.userId) {
        await deleteRefreshTokenByHash(hash);
        throw new UnauthorizedError("Refresh token is invalid");
    }

    if (existingToken.expires_at.getTime() <= Date.now()) {
        await deleteRefreshTokenByHash(hash);
        throw new UnauthorizedError("Refresh token expired");
    }

    const user = await getUserById(existingToken.user_id);
    if (!user) {
        await deleteRefreshTokenByHash(hash);
        throw new UnauthorizedError("User no longer exists");
    }

    await deleteRefreshTokenByHash(hash);
    const tokens = await issueTokensForUser(existingToken.user_id, userAgent);

    return {
        user: await toUserPublic(existingToken.user_id),
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

export function signAccessToken(userId: bigint): string {
    return jwt.sign({ typ: "access" }, env.ACCESS_TOKEN_SECRET, {
        subject: userId.toString(),
        expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    });
}

export function signRefreshToken(userId: bigint): string {
    return jwt.sign(
        {
            typ: "refresh",
            jti: uuidv7(),
        },
        env.REFRESH_TOKEN_SECRET,
        {
            subject: userId.toString(),
            expiresIn: env.REFRESH_TOKEN_TTL_SECONDS,
        },
    );
}

export function verifyAccessToken(token: string): { userId: bigint } {
    try {
        const payload = parseTokenPayload<AccessPayload>(
            jwt.verify(token, env.ACCESS_TOKEN_SECRET),
            "Invalid access token",
        );

        if (payload.typ !== "access" || !payload.sub) {
            throw new UnauthorizedError("Invalid access token");
        }

        return {
            userId: BigInt(payload.sub),
        };
    } catch {
        throw new UnauthorizedError("Invalid or expired access token");
    }
}

export function verifyRefreshToken(token: string): { userId: bigint; jti: string } {
    try {
        const payload = parseTokenPayload<RefreshPayload>(
            jwt.verify(token, env.REFRESH_TOKEN_SECRET),
            "Invalid refresh token",
        );

        if (payload.typ !== "refresh" || !payload.sub || !payload.jti) {
            throw new UnauthorizedError("Invalid refresh token");
        }

        return {
            userId: BigInt(payload.sub),
            jti: payload.jti,
        };
    } catch {
        throw new UnauthorizedError("Invalid or expired refresh token");
    }
}

export function buildTokenPair(userId: bigint, refreshToken: string): TokenPair {
    const accessToken = signAccessToken(userId);

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
