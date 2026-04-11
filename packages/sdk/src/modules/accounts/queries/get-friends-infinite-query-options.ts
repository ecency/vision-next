import { infiniteQueryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { Follow, Profile, FriendsRow } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

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

      const method = mode === "following" ? "get_following" : "get_followers";
      const response = (await callRPC(`condenser_api.${method}`, [following, startFollowing === "" ? null : startFollowing, followType, limit])) as Follow[];

      const accountNames = response.map((e) =>
        mode === "following" ? e.following : e.follower
      );

      // Get profiles via bridge API
      const accounts = (await callRPC("bridge.get_profiles", {
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
