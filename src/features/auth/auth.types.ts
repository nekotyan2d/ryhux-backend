// Request body types
export type RegisterBody = {
    email: string;
    password: string;
    nick: string;
};

export type LoginBody = {
    email: string;
    password: string;
};

export type RefreshBody = {
    refresh_token: string;
};

export type LogoutBody = {
    refresh_token: string;
};

// Response types
export type UserPublic = {
    user_id: string;
    nick: string;
    status?: string | null;
};

export type LoginResponse = {
    user: UserPublic;
    tokens: TokenPair;
};

export type RefreshResponse = {
    user: UserPublic;
    tokens: TokenPair;
};

export type MeResponse = {
    user: UserPublic;
};

export type RegisterResponse = {
    user: UserPublic;
};

export type TokenPair = {
    access_token: string;
    refresh_token: string;
    access_token_expires_in: number;
    refresh_token_expires_in: number;
};

// Internal types
export type UserCredentials = {
    user_id: bigint;
    email: string;
    password_hash: string;
};

export type UserInfo = {
    user_id: bigint;
    nick: string;
    status?: string | null;
};

export type User = {
    user_id: bigint;
    public_id: string | null;
};

export type RefreshTokenRecord = {
    hash: string;
    user_id: bigint;
    expires_at: Date;
};
