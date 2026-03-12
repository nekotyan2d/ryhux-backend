import { BasePublicUser, PublicUser, UserSocialStats } from "@/types/users";

type BasePublicUserSource = Pick<BasePublicUser, "user_id" | "nick">;

type PublicUserSource = Pick<PublicUser, "user_id" | "nick" | "status">;

export function buildBasePublicUser(user: BasePublicUserSource): BasePublicUser {
    return {
        user_id: user.user_id,
        nick: user.nick,
    };
}

export function buildPublicUser(user: PublicUserSource, stats: UserSocialStats): PublicUser {
    return {
        ...buildBasePublicUser(user),
        status: user.status,
        ...stats,
    };
}
