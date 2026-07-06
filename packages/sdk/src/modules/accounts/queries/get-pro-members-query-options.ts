import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";

export interface ProMembersResponse {
  /** Usernames of active Ecency Pro members. */
  members: string[];
  count: number;
}

/**
 * Public, cached roster of Ecency Pro members. Backed by a lightweight private-api
 * endpoint (no auth) so any surface can decorate a username with a Pro badge without
 * a per-user request. The list changes slowly, so it stays fresh for ~5 minutes.
 */
export function getProMembersQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.accounts.proMembers(),
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/pro-members", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pro members: ${response.status}`);
      }

      return response.json() as Promise<ProMembersResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Lowercased set of member usernames for O(1), case-insensitive membership checks. */
export function proMembersSet(members?: string[]): Set<string> {
  return new Set((members ?? []).map((m) => m.toLowerCase()));
}
