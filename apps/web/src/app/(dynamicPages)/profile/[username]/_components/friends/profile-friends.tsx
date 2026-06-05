"use client";

import { Account } from "@/entities";
import { FriendsList } from "./friends-list";
import { FriendsMode, getFriendsTitle } from "./friends-title";

interface Props {
  account: Account;
  mode: FriendsMode;
}

/**
 * Renders the followers/following list inside the profile section area
 * (e.g. /@username/followers) instead of a modal. Reuses {@link FriendsList}
 * with its page variant.
 */
export function ProfileFriends({ account, mode }: Props) {
  return (
    <div className="bg-white/80 dark:bg-dark-200/90 glass-box rounded-none sm:rounded-xl p-4 w-full">
      <h2 className="text-lg font-semibold mb-2">{getFriendsTitle(account, mode)}</h2>
      <FriendsList account={account} mode={mode} variant="page" />
    </div>
  );
}
