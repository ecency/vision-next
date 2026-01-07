import { CONFIG } from "@/modules/core";
import { AccountRelationship, Profile } from "@/modules/accounts/types";
import { Community } from "@/modules/communities/types/community";
import { Subscription } from "@/modules/communities/types/subscription";
import { Entry } from "@/modules/posts/types";
import { filterDmcaEntry } from "@/modules/posts/utils/filter-dmca-entries";

type BridgeParams = Record<string, unknown> | unknown[];

export function bridgeApiCall<T>(endpoint: string, params: BridgeParams): Promise<T> {
  return CONFIG.hiveClient.call("bridge", endpoint, params) as Promise<T>;
}

export async function resolvePost(
  post: Entry,
  observer: string,
  num?: number
): Promise<Entry> {
  const { json_metadata: json } = post;

  if (json?.original_author && json?.original_permlink && json.tags?.[0] === "cross-post") {
    try {
      const resp = await getPost(
        json.original_author,
        json.original_permlink,
        observer,
        num
      );
      if (resp) {
        return {
          ...post,
          original_entry: resp,
          num,
        };
      }
      return post;
    } catch {
      return post;
    }
  }

  return { ...post, num };
}

async function resolvePosts(posts: Entry[], observer: string): Promise<Entry[]> {
  const validatedPosts = posts.map(validateEntry);
  const resolved = await Promise.all(validatedPosts.map((p) => resolvePost(p, observer)));
  return filterDmcaEntry(resolved) as Entry[];
}

export async function getPostsRanked(
  sort: string,
  start_author: string = "",
  start_permlink: string = "",
  limit: number = 20,
  tag: string = "",
  observer: string = ""
): Promise<Entry[] | null> {
  const resp = await bridgeApiCall<Entry[] | null>("get_ranked_posts", {
    sort,
    start_author,
    start_permlink,
    limit,
    tag,
    observer,
  });

  if (resp) {
    return resolvePosts(resp, observer);
  }

  return resp;
}

export async function getAccountPosts(
  sort: string,
  account: string,
  start_author: string = "",
  start_permlink: string = "",
  limit: number = 20,
  observer: string = ""
): Promise<Entry[] | null> {
  if (CONFIG.dmcaAccounts.includes(account)) {
    return [];
  }

  const resp = await bridgeApiCall<Entry[] | null>("get_account_posts", {
    sort,
    account,
    start_author,
    start_permlink,
    limit,
    observer,
  });

  if (resp) {
    return resolvePosts(resp, observer);
  }

  return resp;
}

/**
 * Validates that an Entry object has required properties with non-null values.
 */
function validateEntry(entry: Entry): Entry {
  const requiredStringProps: (keyof Entry)[] = [
    "author",
    "title",
    "body",
    "created",
    "category",
    "permlink",
    "url",
    "updated",
  ];

  for (const prop of requiredStringProps) {
    if (entry[prop] == null) {
      (entry as any)[prop] = "";
    }
  }

  if (entry.author_reputation == null) {
    entry.author_reputation = 0;
  }
  if (entry.children == null) {
    entry.children = 0;
  }
  if (entry.depth == null) {
    entry.depth = 0;
  }
  if (entry.net_rshares == null) {
    entry.net_rshares = 0;
  }
  if (entry.payout == null) {
    entry.payout = 0;
  }
  if (entry.percent_hbd == null) {
    entry.percent_hbd = 0;
  }

  if (!Array.isArray(entry.active_votes)) {
    entry.active_votes = [];
  }
  if (!Array.isArray(entry.beneficiaries)) {
    entry.beneficiaries = [];
  }
  if (!Array.isArray(entry.blacklists)) {
    entry.blacklists = [];
  }
  if (!Array.isArray(entry.replies)) {
    entry.replies = [];
  }

  if (!entry.stats) {
    entry.stats = {
      flag_weight: 0,
      gray: false,
      hide: false,
      total_votes: 0,
    };
  }

  if (entry.author_payout_value == null) {
    entry.author_payout_value = "0.000 HBD";
  }
  if (entry.curator_payout_value == null) {
    entry.curator_payout_value = "0.000 HBD";
  }
  if (entry.max_accepted_payout == null) {
    entry.max_accepted_payout = "1000000.000 HBD";
  }
  if (entry.payout_at == null) {
    entry.payout_at = "";
  }
  if (entry.pending_payout_value == null) {
    entry.pending_payout_value = "0.000 HBD";
  }
  if (entry.promoted == null) {
    entry.promoted = "0.000 HBD";
  }

  if (entry.is_paidout == null) {
    entry.is_paidout = false;
  }

  return entry;
}

export async function getPost(
  author: string = "",
  permlink: string = "",
  observer: string = "",
  num?: number
): Promise<Entry | undefined> {
  const resp = await bridgeApiCall<Entry | null>("get_post", {
    author,
    permlink,
    observer,
  });

  if (resp) {
    const validatedEntry = validateEntry(resp);
    const post = await resolvePost(validatedEntry, observer, num);
    return filterDmcaEntry(post) as Entry;
  }

  return undefined;
}

export async function getPostHeader(
  author: string = "",
  permlink: string = ""
): Promise<Entry | null> {
  const resp = await bridgeApiCall<Entry | null>("get_post_header", {
    author,
    permlink,
  });
  return resp ? validateEntry(resp) : resp;
}

export async function getDiscussion(
  author: string,
  permlink: string,
  observer?: string
): Promise<Record<string, Entry> | null> {
  const resp = await bridgeApiCall<Record<string, Entry> | null>("get_discussion", {
    author,
    permlink,
    observer: observer || author,
  });

  if (resp) {
    const validatedResp: Record<string, Entry> = {};
    for (const [key, entry] of Object.entries(resp)) {
      validatedResp[key] = validateEntry(entry);
    }
    return validatedResp;
  }
  return resp;
}

export async function getCommunity(
  name: string,
  observer: string | undefined = ""
): Promise<Community | null> {
  return bridgeApiCall<Community | null>("get_community", { name, observer });
}

export async function getCommunities(
  last: string = "",
  limit: number = 100,
  query?: string | null,
  sort: string = "rank",
  observer: string = ""
): Promise<Community[] | null> {
  return bridgeApiCall<Community[] | null>("list_communities", {
    last,
    limit,
    query,
    sort,
    observer,
  });
}

export async function normalizePost(post: unknown): Promise<Entry | null> {
  const resp = await bridgeApiCall<Entry | null>("normalize_post", { post });
  return resp ? validateEntry(resp) : resp;
}

export async function getSubscriptions(account: string): Promise<Subscription[] | null> {
  return bridgeApiCall<Subscription[] | null>("list_all_subscriptions", { account });
}

export async function getSubscribers(community: string): Promise<Subscription[] | null> {
  return bridgeApiCall<Subscription[] | null>("list_subscribers", { community });
}

export async function getRelationshipBetweenAccounts(
  follower: string,
  following: string
): Promise<AccountRelationship | null> {
  return bridgeApiCall<AccountRelationship | null>("get_relationship_between_accounts", [
    follower,
    following,
  ]);
}

export async function getProfiles(
  accounts: string[],
  observer?: string
): Promise<Profile[]> {
  return bridgeApiCall<Profile[]>("get_profiles", { accounts, observer });
}
