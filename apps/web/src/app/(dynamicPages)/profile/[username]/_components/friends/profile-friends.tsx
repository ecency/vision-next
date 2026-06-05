"use client";

import i18next from "i18next";
import { Account } from "@/entities";
import { formattedNumber } from "@/utils";
import { FriendsList } from "./friends-list";

interface Props {
  account: Account;
  mode: "followers" | "following";
}

/**
 * Renders the followers/following list inside the profile section area
 * (e.g. /@username/followers) instead of a modal. Reuses {@link FriendsList}
 * with its page variant.
 */
export function ProfileFriends({ account, mode }: Props) {
  const count =
    mode === "followers"
      ? account.follow_stats?.follower_count
      : account.follow_stats?.following_count;
  const titleKey = mode === "followers" ? "friends.followers" : "friends.following";

  return (
    <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-none sm:rounded-xl p-4 w-full">
      <h2 className="text-lg font-semibold mb-2">
        {account.follow_stats
          ? i18next.t(titleKey, {
              n: formattedNumber(count ?? 0, { fractionDigits: 0 })
            })
          : i18next.t(mode === "followers" ? "profile.followers" : "profile.following")}
      </h2>
      <FriendsList account={account} mode={mode} variant="page" />
    </div>
  );
}
