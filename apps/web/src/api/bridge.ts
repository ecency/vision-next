import {Client} from "@hiveio/dhive";
import SERVERS from "../../public/public-nodes.json";
import {Community, Entry, Subscription} from "@/entities";
import dmcaPosts from "../../public/dmca/dmca-posts.json";
import dmcaAccounts from "../../public/dmca/dmca-accounts.json";

export const bridgeServer = new Client(SERVERS, {
  timeout: 2000,
  failoverThreshold: 2,
  consoleOnFailover: false
});
export const dataLimit = typeof window !== "undefined" && window.screen.width < 540 ? 5 : 20;

export const bridgeApiCall = <T>(endpoint: string, params: {}): Promise<T> =>
  bridgeServer.call("bridge", endpoint, params);

export const resolvePost = async (
  post: Entry,
  observer: string,
  num?: number
): Promise<Entry> => {
  const { json_metadata: json } = post;

  if (
    json?.original_author &&
    json?.original_permlink &&
    json.tags?.[0] === "cross-post"
  ) {
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
          num
        };
      }
      return post;
    } catch (e) {
      return post;
    }
  }

  return { ...post, num };
};

const resolvePosts = (posts: Entry[], observer: string): Promise<Entry[]> => {
  // Validate each entry before resolving
  const validatedPosts = posts.map(validateEntry);
  const promises = validatedPosts.map((p) => resolvePost(p, observer));

  return Promise.all(promises);
};

export const getPostsRanked = (
  sort: string,
  start_author: string = "",
  start_permlink: string = "",
  limit: number = dataLimit,
  tag: string = "",
  observer: string = ""
): Promise<Entry[] | null> => {
  return bridgeApiCall<Entry[] | null>("get_ranked_posts", {
    sort,
    start_author,
    start_permlink,
    limit,
    tag,
    observer
  }).then((resp) => {
    if (resp) {
      return resolvePosts(resp, observer);
    }

    return resp;
  });
};

export const getAccountPosts = (
  sort: string,
  account: string,
  start_author: string = "",
  start_permlink: string = "",
  limit: number = dataLimit,
  observer: string = ""
): Promise<Entry[] | null> => {
  return bridgeApiCall<Entry[] | null>("get_account_posts", {
    sort,
    account,
    start_author,
    start_permlink,
    limit,
    observer
  }).then((resp) => {
    if (dmcaAccounts.includes(account)) {
      return [];
    }
    if (resp) {
      return resolvePosts(resp, observer);
    }

    return resp;
  });
};

/**
 * Validates that an Entry object has all required properties with non-null values
 * This prevents runtime errors when the external bridge API returns malformed data
 */
const validateEntry = (entry: Entry): Entry => {
  // List of required string properties that must not be null/undefined
  const requiredStringProps: (keyof Entry)[] = [
    'author',
    'title',
    'body',
    'created',
    'category',
    'permlink',
    'url',
    'updated'
  ];

  // Check and fix null/undefined string properties
  for (const prop of requiredStringProps) {
    if (entry[prop] == null) {
      console.warn(`Entry validation: ${prop} is null/undefined for @${entry.author || 'unknown'}/${entry.permlink || 'unknown'}, setting to empty string`);
      (entry as any)[prop] = '';
    }
  }

  // Ensure numeric properties have sensible defaults
  if (entry.author_reputation == null) {
    console.warn(`Entry validation: author_reputation is null/undefined for @${entry.author}/${entry.permlink}, setting to 0`);
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

  // Ensure array properties are arrays
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

  // Ensure object properties have defaults
  if (!entry.stats) {
    entry.stats = {
      flag_weight: 0,
      gray: false,
      hide: false,
      total_votes: 0
    };
  }

  // Ensure string properties that have specific defaults
  if (entry.author_payout_value == null) {
    entry.author_payout_value = '0.000 HBD';
  }
  if (entry.curator_payout_value == null) {
    entry.curator_payout_value = '0.000 HBD';
  }
  if (entry.max_accepted_payout == null) {
    entry.max_accepted_payout = '1000000.000 HBD';
  }
  if (entry.payout_at == null) {
    entry.payout_at = '';
  }
  if (entry.pending_payout_value == null) {
    entry.pending_payout_value = '0.000 HBD';
  }
  if (entry.promoted == null) {
    entry.promoted = '0.000 HBD';
  }

  // Ensure boolean properties have defaults
  if (entry.is_paidout == null) {
    entry.is_paidout = false;
  }

  return entry;
};

export const getPost = async (
  author: string = "",
  permlink: string = "",
  observer: string = "",
  num?: number
) => {
  const resp = await bridgeApiCall<Entry | null>("get_post", {
    author,
    permlink,
    observer
  });

  if (resp) {
    // Validate and fix the entry before processing
    const validatedEntry = validateEntry(resp);
    const post = await resolvePost(validatedEntry, observer, num);

    if (dmcaPosts.some((pattern) => pattern === `@${post.author}/${post.permlink}`)) {
      post.body = "This post is not available due to a copyright/fraudulent claim.";
      post.title = "";
    }

    return post;
  }

  return undefined;
};

export const getPostHeader = (
  author: string = "",
  permlink: string = ""
): Promise<Entry | null> => {
  return bridgeApiCall<Entry | null>("get_post_header", {
    author,
    permlink
  }).then((resp) => {
    return resp ? validateEntry(resp) : resp;
  });
};

export interface AccountNotification {
  date: string;
  id: number;
  msg: string;
  score: number;
  type: string;
  url: string;
}

export const getAccountNotifications = (
  account: string,
  lastId: number | null = null,
  limit = 50
): Promise<AccountNotification[] | null> => {
  const params: { account: string; last_id?: number; limit: number } = {
    account,
    limit
  };

  if (lastId) {
    params.last_id = lastId;
  }

  return bridgeApiCall<AccountNotification[] | null>("account_notifications", params);
};

export const getDiscussion = (
  author: string,
  permlink: string,
  observer?: string
): Promise<Record<string, Entry> | null> =>
  bridgeApiCall<Record<string, Entry> | null>("get_discussion", {
    author: author,
    permlink: permlink,
    observer: observer || author
  }).then((resp) => {
    if (resp) {
      // Validate each entry in the discussion object
      const validatedResp: Record<string, Entry> = {};
      for (const [key, entry] of Object.entries(resp)) {
        validatedResp[key] = validateEntry(entry);
      }
      return validatedResp;
    }
    return resp;
  });

export const getCommunity = (
  name: string,
  observer: string | undefined = ""
): Promise<Community | null> =>
  bridgeApiCall<Community | null>("get_community", { name, observer });

export const getCommunities = (
  last: string = "",
  limit: number = 100,
  query?: string | null,
  sort: string = "rank",
  observer: string = ""
): Promise<Community[] | null> =>
  bridgeApiCall<Community[] | null>("list_communities", {
    last,
    limit,
    query,
    sort,
    observer
  });

export const normalizePost = (post: any): Promise<Entry | null> =>
  bridgeApiCall<Entry | null>("normalize_post", {
    post
  }).then((resp) => resp ? validateEntry(resp) : resp);

export const getSubscriptions = (account: string): Promise<Subscription[] | null> =>
  bridgeApiCall<Subscription[] | null>("list_all_subscriptions", {
    account
  });

export const getSubscribers = (community: string): Promise<Subscription[] | null> =>
  bridgeApiCall<Subscription[] | null>("list_subscribers", {
    community
  });

export interface AccountRelationship {
  follows: boolean;
  ignores: boolean;
  is_blacklisted: boolean;
  follows_blacklists: boolean;
}

export const getRelationshipBetweenAccounts = (
  follower: string,
  following: string
): Promise<AccountRelationship | null> =>
  bridgeApiCall<AccountRelationship | null>("get_relationship_between_accounts", [
    follower,
    following
  ]);

export interface Profile {
  "active": string,
  "blacklists": string[],
  "context": {
    "followed": boolean,
    "muted": boolean
  },
  "created": string,
  "id": number,
  "metadata": {
    "profile": {
      "about": string,
      "blacklist_description": string,
      "cover_image": string,
      "location": string,
      "muted_list_description": string,
      "name": string,
      "profile_image": string,
      "website": string
    }
  },
  "name": string,
  "post_count": number,
  "reputation": number,
  "stats": {
    "followers": number,
    "following": number,
    "rank": number
  }
}
export const getProfiles = async (
    accounts: string[],
    observer?: string,
): Promise<Profile[]> => {
  return await bridgeApiCall<Profile[]>("get_profiles", {
    accounts,
    observer
  });
}


