"use client";

import { getMutedUsersQuery } from "@/api/queries/get-muted-users-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useMutedUsers(limit = 1000) {
  const { activeUser } = useActiveAccount();

  return getMutedUsersQuery(activeUser, limit).useClientQuery();
}
