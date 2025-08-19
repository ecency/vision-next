import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { Follow, FriendSearchResult } from "@/entities";
import dayjs from "@/utils/dayjs";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import {getProfiles} from "@/api/bridge";

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
      lastPage
        ? {
            startFollowing: lastPage[lastPage.length - 1].name
          }
        : undefined,
    enabled
  });

export const getSearchFriendsQuery = (username: string, mode: string, query: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.GET_SEARCH_FRIENDS, username, mode, query],
    refetchOnMount: false,
    enabled: !!query,
    queryFn: async () => {
      let request;
      if (mode === "following") {
        request = appAxios.post<FriendSearchResult[]>(apiBase(`/search-api/search-following`), {
          follower: username,
          q: query
        });
      } else {
        request = appAxios.post<FriendSearchResult[]>(apiBase(`/search-api/search-follower`), {
          following: username,
          q: query
        });
      }

      const { data } = await request;

      const followingAccountNames = data.map((friend) => friend.name);
      const accounts = await getProfiles(followingAccountNames);

      return data.map((friend) => {
        const isMatch = accounts?.find((account) => account.name === friend.name);
        if (!isMatch) {
          return friend;
        }

        const lastActive = dayjs(isMatch.active);

        return {
          ...friend,
          lastSeen: lastActive.fromNow()
        };
      });
    }
  });
