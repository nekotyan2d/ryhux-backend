import {
    AnyPgColumn,
    bigserial,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
export const usersTable = pgTable("user", {
    user_id: bigserial({ mode: "bigint" }).primaryKey(),
    public_id: uuid().unique(),
});

export const userCredentialsTable = pgTable("user_credential", {
    user_id: bigserial({ mode: "bigint" })
        .primaryKey()
        .references(() => usersTable.user_id, { onDelete: "cascade" }),
    email: varchar().notNull().unique(),
    password_hash: varchar().notNull(),
});

export const userInfoTable = pgTable("user_info", {
    user_id: bigserial({ mode: "bigint" })
        .primaryKey()
        .references(() => usersTable.user_id, { onDelete: "cascade" }),
    nick: varchar({ length: 20 }).notNull(),
    status: varchar({ length: 100 }),
});

export const userRolesTable = pgTable(
    "user_role",
    {
        user_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
        role: serial().references(() => rolesTable.role_id, { onDelete: "cascade" }),
    },
    (table) => [unique().on(table.user_id, table.role)],
);

export const rolesTable = pgTable("roles", {
    role_id: serial().primaryKey(),
    name: varchar().notNull().unique(),
});

export const userTagsTable = pgTable("user_tag", {
    user_id: bigserial({ mode: "bigint" })
        .primaryKey()
        .references(() => usersTable.user_id, { onDelete: "cascade" }),
    tag: varchar().notNull(),
    created_at: timestamp().notNull().defaultNow(),
});

export const userSubscriptionTable = pgTable(
    "user_subscription",
    {
        follower_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
        following_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
        created_at: timestamp().notNull().defaultNow(),
    },
    (table) => {
        return [unique().on(table.follower_id, table.following_id)];
    },
);

export const userBlockTable = pgTable(
    "user_block",
    {
        blocker_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
        blocked_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
        created_at: timestamp().notNull().defaultNow(),
    },
    (table) => [unique().on(table.blocker_id, table.blocked_id)],
);

export const postTable = pgTable("post", {
    post_id: bigserial({ mode: "bigint" }).primaryKey(),
    public_id: uuid().unique(),
    author_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
    text: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
});

export const attachmentTable = pgTable("attachment", {
    attachment_id: bigserial({ mode: "bigint" }).primaryKey(),
    post_id: bigserial({ mode: "bigint" }).references(() => postTable.post_id, { onDelete: "cascade" }),
    comment_id: bigserial({ mode: "bigint" }).references(() => commentTable.comment_id, { onDelete: "cascade" }),
    file_url: varchar().notNull(),
    type_id: integer()
        .notNull()
        .references(() => attachmentTypeTable.type_id, { onDelete: "cascade" }),
    created_at: timestamp().notNull().defaultNow(),
});

export const attachmentTypeTable = pgTable("attachment_type", {
    type_id: integer().primaryKey(),
    name: varchar().notNull().unique(),
});

export const commentTable = pgTable("comment", {
    comment_id: bigserial({ mode: "bigint" }).primaryKey(),
    reply_to: bigserial({ mode: "bigint" }).references((): AnyPgColumn => commentTable.comment_id, {
        onDelete: "cascade",
    }),
    public_id: uuid().unique(),
    author_id: bigserial({ mode: "bigint" }).references(() => usersTable.user_id, { onDelete: "cascade" }),
    post_id: bigserial({ mode: "bigint" }).references(() => postTable.post_id, { onDelete: "cascade" }),
    text: text(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
});

export const refreshTokenTable = pgTable("refresh_token", {
    hash: varchar().primaryKey(),
    user_id: bigserial({ mode: "bigint" })
        .notNull()
        .references(() => usersTable.user_id, { onDelete: "cascade" }),
    expires_at: timestamp().notNull(),
    created_at: timestamp().notNull().defaultNow(),
    user_agent: varchar().notNull().default("unknown"),
});
