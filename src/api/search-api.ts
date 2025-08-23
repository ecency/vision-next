import { dataLimit, getProfiles } from "./bridge";
import { apiBase } from "./helper";
import {
  AccountSearchResult,
  FriendSearchResult,
  SearchResponse,
  TagSearchResult,
  Follow
} from "@/entities";
import { appAxios } from "@/api/axios";
import { client } from "@/api/hive";
import dayjs from "@/utils/dayjs";

const searchLimit = 30;

export const search = (
  q: string,
  sort: string,
  hideLow: string,
  since?: string,
  scroll_id?: string,
  votes?: number
): Promise<SearchResponse> => {
  const data: {
    q: string;
    sort: string;
    hide_low: string;
    since?: string;
    scroll_id?: string;
    votes?: number;
  } = { q, sort, hide_low: hideLow };

  if (since) data.since = since;
  if (scroll_id) data.scroll_id = scroll_id;
  if (votes) data.votes = votes;

  return appAxios.post(apiBase(`/search-api/search`), data).then((resp) => resp.data);
};

export const searchFollower = async (
  following: string,
  q: string
): Promise<FriendSearchResult[]> => {
  const start = q.slice(0, -1);
  const response = (await client.database.call("get_followers", [
    following,
    start,
    "blog",
    1000
  ])) as Follow[];

  const qLower = q.toLowerCase();
  const accountNames = response
    .map((e) => e.follower)
    .filter((name) => name.toLowerCase().includes(qLower))
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
};

export const searchFollowing = async (
  follower: string,
  q: string
): Promise<FriendSearchResult[]> => {
  const start = q.slice(0, -1);
  const response = (await client.database.call("get_following", [
    follower,
    start,
    "blog",
    1000
  ])) as Follow[];

  const qLower = q.toLowerCase();
  const accountNames = response
    .map((e) => e.following)
    .filter((name) => name.toLowerCase().includes(qLower))
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
};

export const searchAccount = (
  q: string = "",
  limit: number = dataLimit,
  random: number = 1
): Promise<AccountSearchResult[]> => {
  const data = { q, limit, random };

  return appAxios.post(apiBase(`/search-api/search-account`), data).then((resp) => resp.data);
};
export const searchTag = (
  q: string = "",
  limit: number = dataLimit,
  random: number = 0
): Promise<TagSearchResult[]> => {
  const data = { q, limit, random };

  return appAxios.post(apiBase(`/search-api/search-tag`), data).then((resp) => resp.data);
};

export const searchPath = (username: string, q: string): Promise<string[]> => {
  const data = { q };
  return appAxios.post(apiBase(`/search-api/search-path`), data).then((resp) => resp.data);
};
