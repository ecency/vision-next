import { type InfiniteData, infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { Follow, Profile, FriendsRow } from "../types";

export interface FriendsPageParam {
  startFollowing: string;
}

type FriendsPage = FriendsRow[];

/**
 * Get list of friends (following/followers) with profile information
 *
 * @param following - The account whose friends to get
 * @param mode - "following" or "followers"
 * @param followType - Type of follow relationship (default: "blog")
 * @param limit - Number of results per page (default: 100)
 * @param enabled - Whether query is enabled (default: true)
 */
export function getFriendsInfiniteQueryOptions(
  following: string,
  mode: "following" | "followers",
  options?: {
    followType?: string;
    limit?: number;
    enabled?: boolean;
  }
) {
  const { followType = "blog", limit = 100, enabled = true } = options ?? {};

  return infiniteQueryOptions<FriendsPage, Error, FriendsPage, (string | number)[], FriendsPageParam>({
    queryKey: QueryKeys.accounts.friends(following, mode, followType, limit),
    initialPageParam: { startFollowing: "" } as FriendsPageParam,
    enabled,
    refetchOnMount: true,

    queryFn: async ({ pageParam }: { pageParam: FriendsPageParam }) => {
      const { startFollowing } = pageParam;

      const response = (await CONFIG.hiveClient.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [following, startFollowing === "" ? null : startFollowing, followType, limit]
      )) as Follow[];

      const accountNames = response.map((e) =>
        mode === "following" ? e.following : e.follower
      );

      // Get profiles via bridge API
      const accounts = (await CONFIG.hiveClient.call("bridge", "get_profiles", {
        accounts: accountNames,
        observer: undefined,
      })) as Profile[];

      const rows: FriendsPage = (accounts ?? []).map((a) => ({
        name: a.name,
        reputation: a.reputation,
        active: a.active, // Return raw timestamp
      }));

      return rows;
    },

    getNextPageParam: (lastPage: FriendsPage): FriendsPageParam | undefined =>
      lastPage && lastPage.length === limit
        ? { startFollowing: lastPage[lastPage.length - 1].name }
        : undefined,
  });
}
