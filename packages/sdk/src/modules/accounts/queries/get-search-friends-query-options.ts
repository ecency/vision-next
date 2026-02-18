import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { Follow, Profile, FriendSearchResult } from "../types";

const SEARCH_LIMIT = 30;

/**
 * Search friends (following/followers) by query string
 *
 * @param username - The account whose friends to search
 * @param mode - "following" or "followers"
 * @param query - Search query string
 */
export function getSearchFriendsQueryOptions(
  username: string,
  mode: "following" | "followers",
  query: string
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.searchFriends(username, mode, query),
    refetchOnMount: false,
    enabled: false, // Manual query via refetch
    queryFn: async (): Promise<FriendSearchResult[]> => {
      if (!query) return [];

      const start = query.slice(0, -1);
      const response = (await CONFIG.hiveClient.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [username, start, "blog", 1000]
      )) as Follow[];

      const accountNames = response
        .map((e) => (mode === "following" ? e.following : e.follower))
        .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, SEARCH_LIMIT);

      // Get profiles via bridge API
      const accounts = (await CONFIG.hiveClient.call("bridge", "get_profiles", {
        accounts: accountNames,
        observer: undefined,
      })) as Profile[];

      return (
        accounts?.map((a) => ({
          name: a.name,
          full_name: a.metadata.profile?.name || "",
          reputation: a.reputation,
          active: a.active, // Return raw timestamp
        })) ?? []
      );
    },
  });
}
