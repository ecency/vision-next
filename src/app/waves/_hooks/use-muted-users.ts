"use client";

import { getMutedUsersQuery } from "@/api/queries/get-muted-users-query";
import { useGlobalStore } from "@/core/global-store";

export function useMutedUsers(limit = 1000) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  return getMutedUsersQuery(activeUser, limit).useClientQuery();
}
