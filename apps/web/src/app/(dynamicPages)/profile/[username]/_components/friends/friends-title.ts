import i18next from "i18next";
import { Account } from "@/entities";
import { formattedNumber } from "@/utils";

export type FriendsMode = "followers" | "following";

export function getFriendsCount(account: Account, mode: FriendsMode): number | undefined {
  return mode === "followers"
    ? account.follow_stats?.follower_count
    : account.follow_stats?.following_count;
}

/**
 * Localized "Followers (N)" / "Following (N)" title shared by the followers
 * modal and the profile section. Falls back to the plain label while the
 * follow stats are still loading.
 */
export function getFriendsTitle(account: Account, mode: FriendsMode): string {
  return account.follow_stats
    ? i18next.t(`friends.${mode}`, {
        n: formattedNumber(getFriendsCount(account, mode) ?? 0, { fractionDigits: 0 })
      })
    : i18next.t(`profile.${mode}`);
}
