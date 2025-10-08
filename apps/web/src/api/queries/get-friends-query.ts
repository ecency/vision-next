import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { Follow, FriendSearchResult } from "@/entities";
import dayjs from "@/utils/dayjs";
import { getProfiles } from "@/api/bridge";

const searchLimit = 30;

// ---- Types for the infinite friends query ----
type FriendsPageParam = { startFollowing: string };
type FriendsRow = { name: string; reputation: number; lastSeen: string };
type FriendsPage = FriendsRow[];

// Infinite list of friends/followers
export const getFriendsQuery = (
    following: string,
    mode: string,
    {
        followType = "blog",
        limit = 100,
        enabled = true,
    }: { enabled?: boolean; followType?: string; limit?: number }
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<FriendsPage, FriendsPageParam>({
        queryKey: [QueryIdentifiers.GET_FRIENDS, following, mode, followType, limit],
        refetchOnMount: true,
        enabled,
        initialData: { pages: [], pageParams: [] },
        initialPageParam: { startFollowing: "" } as FriendsPageParam,
        queryFn: async ({ pageParam }: { pageParam: FriendsPageParam }) => {
            const { startFollowing } = pageParam;

            const response = (await client.database.call(
                mode === "following" ? "get_following" : "get_followers",
                [following, startFollowing === "" ? null : startFollowing, followType, limit]
            )) as Follow[];

            const accountNames = response.map((e) =>
                mode === "following" ? e.following : e.follower
            );

            const accounts = await getProfiles(accountNames);

            const rows: FriendsPage = (accounts ?? []).map((a) => {
                const lastActive = dayjs(a.active);
                return {
                    name: a.name,
                    reputation: a.reputation!,
                    lastSeen: lastActive.fromNow(),
                };
            });

            return rows;
        },
        getNextPageParam: (lastPage: FriendsPage): FriendsPageParam | undefined =>
            lastPage && lastPage.length === limit
                ? { startFollowing: lastPage[lastPage.length - 1].name }
                : undefined,
    });

// One-shot search (non-infinite)
export const getSearchFriendsQuery = (username: string, mode: string, query: string) =>
    EcencyQueriesManager.generateClientServerQuery<FriendSearchResult[]>({
        queryKey: [QueryIdentifiers.GET_SEARCH_FRIENDS, username, mode, query],
        refetchOnMount: false,
        enabled: false,
        queryFn: async () => {
            if (!query) return [];

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
                        lastSeen: lastActive.fromNow(),
                    } as FriendSearchResult;
                }) ?? []
            );
        },
    });
