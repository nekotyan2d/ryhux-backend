# Users Feature TODO

Status: planned
Owner branch: `feat/users`
Date: 2026-03-09

## Goals

1. Get user profile by public id (UUID).
2. Implement user subscription features:
    - follow user
    - add friend (modeled as mutual follow)
3. Implement search in a way that can be expanded later to posts and other entities.

## Important Schema Notes (must resolve first)

1. `user_subscription` currently has `.unique()` on both `follower_id` and `following_id`.
    - This allows each user to follow only one user and be followed by only one user.
    - Expected for social graph: many-to-many.
    - Task: replace per-column unique constraints with a composite unique key `(follower_id, following_id)`.
2. `users.public_id` should be `.notNull().unique()` for stable public lookup by UUID.
3. Decide if friendship is explicit or derived:
    - Option A: derive friend from two opposite follow rows.
    - Option B: create dedicated `friendship` table.
    - Current recommendation: Option A (no extra table now).

## API Design TODO

### 1) Profile by UUID

1. `GET /users/:publicId`
2. Validate `publicId` as UUID.
3. Return:
    - `user_id`
    - `nick`
    - `status`
    - counters: `followers_count`, `following_count`, `friends_count`
    - relationship flags (if authenticated): `isFollowing`, `isFollower`, `isFriend`, `isBlocked`
4. Errors:
    - `400` invalid UUID
    - `404` user not found

### 2) Subscription / Friendship

1. `POST /users/:publicId/follow`
    - Auth required
    - No self-follow
    - Idempotent behavior (repeating follow should not fail)
2. `DELETE /users/:publicId/follow`
    - Auth required
    - Idempotent unfollow
3. `POST /users/:publicId/friend`
    - Auth required
    - Implementation for Option A:
        - ensure both follow edges exist
4. `DELETE /users/:publicId/friend`
    - Auth required
    - remove both follow edges
5. Optional read endpoints:
    - `GET /users/:publicId/followers`
    - `GET /users/:publicId/following`
    - `GET /users/:publicId/friends`

### 3) Search (future-proof)

1. Start with vertical endpoint:
    - `GET /search/users?q=...&limit=...&cursor=...`
2. Add a generic search facade now for future extension:
    - `GET /search?q=...&type=users|posts|all`
    - Initially only `users` implemented; return `501` or empty sections for unsupported types.
3. Response contract should be entity-grouped to avoid breaking changes later:
    - `results.users[]`
    - `results.posts[]`
    - `nextCursor` per entity group when needed.
4. Use cursor pagination over offset for scalability.
5. Add basic ranking now (prefix match on nick > substring), keep pluggable for later full-text search.

## Module Implementation TODO

Create `src/features/users/` with:

1. `users.routes.ts`
2. `users.controller.ts`
3. `users.service.ts`
4. `users.repository.ts`
5. `users.schemas.ts`
6. `users.types.ts`
7. `index.ts`

Integration:

1. Register users tag in OpenAPI (`src/index.ts`).
2. Register routes with prefix `/users` and search routes with prefix `/search`.
3. Reuse auth middleware for protected operations.

## Repository Tasks

1. Add repository queries:
    - find user by `public_id`
    - follow/unfollow (upsert or conflict-safe insert)
    - check relationship state between two users
    - compute followers/following/friends counts
    - search users by nick/status with cursor
2. Add DB indexes:
    - `user(public_id)` unique index (if not already effective)
    - `user_info(nick)` index
    - `user_subscription(follower_id, following_id)` unique composite
    - `user_subscription(following_id)` index for follower lists

## Validation / Errors / Security

1. Block actions if target user is blocked by actor or actor is blocked by target.
2. Return domain errors via `AppError` with stable messages.
3. Enforce max `limit` for list/search endpoints.
4. Trim and normalize search query.

## Test TODO

1. Unit tests for service rules:
    - self-follow forbidden
    - follow idempotency
    - friend add/remove behavior
2. Route tests:
    - profile lookup success and 404
    - auth-required endpoints return 401
3. Search tests:
    - empty query validation
    - prefix ranking behavior
    - cursor pagination continuity

## Suggested Delivery Order

1. Fix schema constraints and run migration.
2. Implement profile by UUID (read-only path first).
3. Implement follow/unfollow.
4. Implement friend add/remove.
5. Implement users-only search endpoint.
6. Add generic `/search` facade for future posts integration.
7. Add tests and OpenAPI polish.

## Open Decisions

1. Confirm friend model: derived mutual follow (recommended) vs dedicated table.
2. Confirm whether `/search` should return `501` for non-users types or silently return empty arrays during phase 1.
3. Confirm whether blocked users are excluded from search results.
