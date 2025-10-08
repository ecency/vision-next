import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { Follow, FriendSearchResult } from "@/entities";
import dayjs from "@/utils/dayjs";
import { getProfiles } from "@/api/bridge";

const searchLimit = 30;

export const getFriendsQuery = (
  following: string,
  mode: string,
  {
    followType = "blog",
    limit = 100,
    enabled = true
  }: { enabled?: boolean; followType?: string; limit?: number }
) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.GET_FRIENDS, following, mode, followType, limit],
    queryFn: async ({ pageParam: { startFollowing } }) => {
      const response = (await client.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [following, startFollowing === "" ? null : startFollowing, followType, limit]
      )) as Follow[];
      const accountNames = response.map((e) => (mode === "following" ? e.following : e.follower));
      const accounts = await getProfiles(accountNames);
      return accounts?.map((a) => {
        const lastActive = dayjs(a.active);
        return {
          name: a.name,
          reputation: a.reputation!,
          lastSeen: lastActive.fromNow()
        };
      });
    },
    refetchOnMount: true,
    initialData: { pages: [], pageParams: [] },
    initialPageParam: { startFollowing: "" },
    getNextPageParam: (lastPage) =>
      lastPage && lastPage.length === limit
        ? { startFollowing: lastPage[lastPage.length - 1].name }
        : undefined,
    enabled
  });

export const getSearchFriendsQuery = (username: string, mode: string, query: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.GET_SEARCH_FRIENDS, username, mode, query],
    refetchOnMount: false,
    enabled: false,
    queryFn: async () => {
      if (!query) {
        return [];
      }

      const start = query.slice(0, -1);
      const response = (await client.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [username, start, "blog", 1000]
      )) as Follow[];

      const accountNames = response
        .map((e) => (mode === "following" ? e.following : e.follower))
        .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, searchLimit);
      const accounts = await getProfiles(accountNames);

      return (
        accounts?.map((a) => {
          const lastActive = dayjs(a.active);
          return {
            name: a.name,
            full_name: a.metadata.profile?.name || "",
            reputation: a.reputation!,
            lastSeen: lastActive.fromNow()
          } as FriendSearchResult;
        }) ?? []
      );
    }
  });
