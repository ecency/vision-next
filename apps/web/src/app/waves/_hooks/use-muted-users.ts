"use client";

import { getMutedUsersQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useMutedUsers(limit = 1000) {
  const { activeUser } = useActiveAccount();

  return useQuery(getMutedUsersQueryOptions(activeUser?.username, limit));
}
