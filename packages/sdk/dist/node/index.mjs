import { QueryClient, useQuery, useInfiniteQuery, useMutation, queryOptions, useQueryClient, infiniteQueryOptions } from '@tanstack/react-query';
import { Client, PrivateKey, cryptoUtils, RCAPI } from '@hiveio/dhive';
import hs from 'hivesigner';
import * as R4 from 'remeda';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/modules/core/mock-storage.ts
var MockStorage = class {
  length = 0;
  clear() {
    throw new Error("Method not implemented.");
  }
  getItem(key) {
    return this[key];
  }
  key(index) {
    return Object.keys(this)[index];
  }
  removeItem(key) {
    delete this[key];
  }
  setItem(key, value) {
    this[key] = value;
  }
};
var CONFIG = {
  privateApiHost: "https://ecency.com",
  storage: typeof window === "undefined" ? new MockStorage() : window.localStorage,
  storagePrefix: "ecency",
  hiveClient: new Client(
    [
      "https://api.hive.blog",
      "https://api.deathwing.me",
      "https://rpc.mahdiyari.info",
      "https://api.openhive.network",
      "https://techcoderx.com",
      "https://hive-api.arcange.eu",
      "https://api.syncad.com",
      "https://anyx.io",
      "https://api.c0ff33a.uk",
      "https://hiveapi.actifit.io",
      "https://hive-api.3speak.tv"
    ],
    {
      timeout: 2e3,
      failoverThreshold: 2,
      consoleOnFailover: true
    }
  ),
  heliusApiKey: process.env.VITE_HELIUS_API_KEY,
  queryClient: new QueryClient(),
  plausibleHost: "https://pl.ecency.com",
  spkNode: "https://spk.good-karma.xyz"
};
var ConfigManager;
((ConfigManager2) => {
  function setQueryClient(client) {
    CONFIG.queryClient = client;
  }
  ConfigManager2.setQueryClient = setQueryClient;
})(ConfigManager || (ConfigManager = {}));

// src/modules/core/utils/decoder-encoder.ts
function encodeObj(o) {
  return btoa(JSON.stringify(o));
}
function decodeObj(o) {
  let dataToParse = atob(o);
  if (dataToParse[0] !== "{") {
    return void 0;
  }
  return JSON.parse(dataToParse);
}

// src/modules/core/utils/parse-asset.ts
var Symbol2 = /* @__PURE__ */ ((Symbol3) => {
  Symbol3["HIVE"] = "HIVE";
  Symbol3["HBD"] = "HBD";
  Symbol3["VESTS"] = "VESTS";
  Symbol3["SPK"] = "SPK";
  return Symbol3;
})(Symbol2 || {});
var NaiMap = /* @__PURE__ */ ((NaiMap2) => {
  NaiMap2["@@000000021"] = "HIVE";
  NaiMap2["@@000000013"] = "HBD";
  NaiMap2["@@000000037"] = "VESTS";
  return NaiMap2;
})(NaiMap || {});
function parseAsset(sval) {
  if (typeof sval === "string") {
    const sp = sval.split(" ");
    return {
      amount: parseFloat(sp[0]),
      // @ts-ignore
      symbol: Symbol2[sp[1]]
    };
  } else {
    return {
      amount: parseFloat(sval.amount.toString()) / Math.pow(10, sval.precision),
      // @ts-ignore
      symbol: NaiMap[sval.nai]
    };
  }
}

// src/modules/core/utils/get-bound-fetch.ts
var cachedFetch;
function getBoundFetch() {
  if (!cachedFetch) {
    if (typeof globalThis.fetch !== "function") {
      throw new Error("[Ecency][SDK] - global fetch is not available");
    }
    cachedFetch = globalThis.fetch.bind(globalThis);
  }
  return cachedFetch;
}

// src/modules/core/storage.ts
var getUser = (username) => {
  try {
    const raw = CONFIG.storage.getItem(
      CONFIG.storagePrefix + "_user_" + username
    );
    return decodeObj(JSON.parse(raw));
  } catch (e) {
    console.error(e);
    return void 0;
  }
};
var getAccessToken = (username) => getUser(username) && getUser(username).accessToken;
var getPostingKey = (username) => getUser(username) && getUser(username).postingKey;
var getLoginType = (username) => getUser(username) && getUser(username).loginType;
var getRefreshToken = (username) => getUser(username) && getUser(username).refreshToken;

// src/modules/keychain/keychain.ts
var keychain_exports = {};
__export(keychain_exports, {
  broadcast: () => broadcast,
  customJson: () => customJson,
  handshake: () => handshake
});
function handshake() {
  return new Promise((resolve) => {
    window.hive_keychain?.requestHandshake(() => {
      resolve();
    });
  });
}
var broadcast = (account, operations, key, rpc = null) => new Promise((resolve, reject) => {
  window.hive_keychain?.requestBroadcast(
    account,
    operations,
    key,
    (resp) => {
      if (!resp.success) {
        reject({ message: "Operation cancelled" });
      }
      resolve(resp);
    },
    rpc
  );
});
var customJson = (account, id, key, json, display_msg, rpc = null) => new Promise((resolve, reject) => {
  window.hive_keychain?.requestCustomJson(
    account,
    id,
    key,
    json,
    display_msg,
    (resp) => {
      if (!resp.success) {
        reject({ message: "Operation cancelled" });
      }
      resolve(resp);
    },
    rpc
  );
});

// src/modules/core/mutations/use-broadcast-mutation.ts
function useBroadcastMutation(mutationKey = [], username, operations, onSuccess = () => {
}) {
  return useMutation({
    onSuccess,
    mutationKey: [...mutationKey, username],
    mutationFn: async (payload) => {
      if (!username) {
        throw new Error(
          "[Core][Broadcast] Attempted to call broadcast API with anon user"
        );
      }
      const postingKey = getPostingKey(username);
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);
        return CONFIG.hiveClient.broadcast.sendOperations(
          operations(payload),
          privateKey
        );
      }
      const loginType = getLoginType(username);
      if (loginType && loginType == "keychain") {
        return keychain_exports.broadcast(
          username,
          operations(payload),
          "Posting"
        ).then((r) => r.result);
      }
      let token = getAccessToken(username);
      if (token) {
        const f = getBoundFetch();
        const res = await f("https://hivesigner.com/api/broadcast", {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ operations: operations(payload) })
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`[Hivesigner] ${res.status} ${res.statusText} ${txt}`);
        }
        const json = await res.json();
        if (json?.errors) {
          throw new Error(`[Hivesigner] ${JSON.stringify(json.errors)}`);
        }
        return json.result;
      }
      throw new Error(
        "[SDK][Broadcast] \u2013 cannot broadcast w/o posting key or token"
      );
    }
  });
}
async function broadcastJson(username, id, payload) {
  if (!username) {
    throw new Error(
      "[Core][Broadcast] Attempted to call broadcast API with anon user"
    );
  }
  const jjson = {
    id,
    required_auths: [],
    required_posting_auths: [username],
    json: JSON.stringify(payload)
  };
  const postingKey = getPostingKey(username);
  if (postingKey) {
    const privateKey = PrivateKey.fromString(postingKey);
    return CONFIG.hiveClient.broadcast.json(
      jjson,
      privateKey
    );
  }
  const loginType = getLoginType(username);
  if (loginType && loginType == "keychain") {
    return keychain_exports.broadcast(username, [["custom_json", jjson]], "Posting").then((r) => r.result);
  }
  let token = getAccessToken(username);
  if (token) {
    const response = await new hs.Client({
      accessToken: token
    }).customJson([], [username], id, JSON.stringify(payload));
    return response.result;
  }
  throw new Error(
    "[SDK][Broadcast] \u2013 cannot broadcast w/o posting key or token"
  );
}
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        // staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false
      }
    }
  });
}
var getQueryClient = () => CONFIG.queryClient;
var EcencyQueriesManager;
((EcencyQueriesManager2) => {
  function getQueryData(queryKey) {
    const queryClient = getQueryClient();
    return queryClient.getQueryData(queryKey);
  }
  EcencyQueriesManager2.getQueryData = getQueryData;
  function getInfiniteQueryData(queryKey) {
    const queryClient = getQueryClient();
    return queryClient.getQueryData(queryKey);
  }
  EcencyQueriesManager2.getInfiniteQueryData = getInfiniteQueryData;
  async function prefetchQuery(options) {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(options);
    return getQueryData(options.queryKey);
  }
  EcencyQueriesManager2.prefetchQuery = prefetchQuery;
  async function prefetchInfiniteQuery(options) {
    const queryClient = getQueryClient();
    await queryClient.prefetchInfiniteQuery(options);
    return getInfiniteQueryData(options.queryKey);
  }
  EcencyQueriesManager2.prefetchInfiniteQuery = prefetchInfiniteQuery;
  function generateClientServerQuery(options) {
    return {
      prefetch: () => prefetchQuery(options),
      getData: () => getQueryData(options.queryKey),
      useClientQuery: () => useQuery(options),
      fetchAndGet: () => getQueryClient().fetchQuery(options)
    };
  }
  EcencyQueriesManager2.generateClientServerQuery = generateClientServerQuery;
  function generateClientServerInfiniteQuery(options) {
    return {
      prefetch: () => prefetchInfiniteQuery(options),
      getData: () => getInfiniteQueryData(options.queryKey),
      useClientQuery: () => useInfiniteQuery(options),
      fetchAndGet: () => getQueryClient().fetchInfiniteQuery(options)
    };
  }
  EcencyQueriesManager2.generateClientServerInfiniteQuery = generateClientServerInfiniteQuery;
})(EcencyQueriesManager || (EcencyQueriesManager = {}));
function getDynamicPropsQueryOptions() {
  return queryOptions({
    queryKey: ["core", "dynamic-props"],
    refetchInterval: 6e4,
    staleTime: 6e4,
    refetchOnMount: true,
    queryFn: async () => {
      const globalDynamic = await CONFIG.hiveClient.database.getDynamicGlobalProperties().then((r) => ({
        total_vesting_fund_hive: r.total_vesting_fund_hive || r.total_vesting_fund_steem,
        total_vesting_shares: r.total_vesting_shares,
        hbd_print_rate: r.hbd_print_rate || r.sbd_print_rate,
        hbd_interest_rate: r.hbd_interest_rate,
        head_block_number: r.head_block_number,
        vesting_reward_percent: r.vesting_reward_percent,
        virtual_supply: r.virtual_supply
      }));
      const feedHistory = await CONFIG.hiveClient.database.call("get_feed_history");
      const chainProps = await CONFIG.hiveClient.database.call(
        "get_chain_properties"
      );
      const rewardFund = await CONFIG.hiveClient.database.call(
        "get_reward_fund",
        ["post"]
      );
      const hivePerMVests = parseAsset(globalDynamic.total_vesting_fund_hive).amount / parseAsset(globalDynamic.total_vesting_shares).amount * 1e6;
      const base = parseAsset(feedHistory.current_median_history.base).amount;
      const quote = parseAsset(feedHistory.current_median_history.quote).amount;
      const fundRecentClaims = parseFloat(rewardFund.recent_claims);
      const fundRewardBalance = parseAsset(rewardFund.reward_balance).amount;
      const hbdPrintRate = globalDynamic.hbd_print_rate;
      const hbdInterestRate = globalDynamic.hbd_interest_rate;
      const headBlock = globalDynamic.head_block_number;
      const totalVestingFund = parseAsset(
        globalDynamic.total_vesting_fund_hive
      ).amount;
      const totalVestingShares = parseAsset(
        globalDynamic.total_vesting_shares
      ).amount;
      const virtualSupply = parseAsset(globalDynamic.virtual_supply).amount;
      const vestingRewardPercent = globalDynamic.vesting_reward_percent;
      const accountCreationFee = chainProps.account_creation_fee;
      return {
        hivePerMVests,
        base,
        quote,
        fundRecentClaims,
        fundRewardBalance,
        hbdPrintRate,
        hbdInterestRate,
        headBlock,
        totalVestingFund,
        totalVestingShares,
        virtualSupply,
        vestingRewardPercent,
        accountCreationFee
      };
    }
  });
}
function getAccountFullQueryOptions(username) {
  return queryOptions({
    queryKey: ["get-account-full", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK] Username is empty");
      }
      const response = await CONFIG.hiveClient.database.getAccounts([
        username
      ]);
      if (!response[0]) {
        throw new Error("[SDK] No account with given username");
      }
      const profile = parseProfileMetadata(response[0].posting_json_metadata);
      let follow_stats;
      try {
        follow_stats = await CONFIG.hiveClient.database.call(
          "get_follow_count",
          [username]
        );
      } catch (e) {
      }
      let reputationValue = 0;
      try {
        const reputation = await CONFIG.hiveClient.call(
          "condenser_api",
          "get_account_reputations",
          [username, 1]
        );
        reputationValue = reputation[0]?.reputation ?? 0;
      } catch (e) {
      }
      return {
        name: response[0].name,
        owner: response[0].owner,
        active: response[0].active,
        posting: response[0].posting,
        memo_key: response[0].memo_key,
        post_count: response[0].post_count,
        created: response[0].created,
        posting_json_metadata: response[0].posting_json_metadata,
        last_vote_time: response[0].last_vote_time,
        last_post: response[0].last_post,
        json_metadata: response[0].json_metadata,
        reward_hive_balance: response[0].reward_hive_balance,
        reward_hbd_balance: response[0].reward_hbd_balance,
        reward_vesting_hive: response[0].reward_vesting_hive,
        reward_vesting_balance: response[0].reward_vesting_balance,
        balance: response[0].balance,
        hbd_balance: response[0].hbd_balance,
        savings_balance: response[0].savings_balance,
        savings_hbd_balance: response[0].savings_hbd_balance,
        savings_hbd_last_interest_payment: response[0].savings_hbd_last_interest_payment,
        savings_hbd_seconds_last_update: response[0].savings_hbd_seconds_last_update,
        savings_hbd_seconds: response[0].savings_hbd_seconds,
        next_vesting_withdrawal: response[0].next_vesting_withdrawal,
        pending_claimed_accounts: response[0].pending_claimed_accounts,
        vesting_shares: response[0].vesting_shares,
        delegated_vesting_shares: response[0].delegated_vesting_shares,
        received_vesting_shares: response[0].received_vesting_shares,
        vesting_withdraw_rate: response[0].vesting_withdraw_rate,
        to_withdraw: response[0].to_withdraw,
        withdrawn: response[0].withdrawn,
        witness_votes: response[0].witness_votes,
        proxy: response[0].proxy,
        recovery_account: response[0].recovery_account,
        proxied_vsf_votes: response[0].proxied_vsf_votes,
        voting_manabar: response[0].voting_manabar,
        voting_power: response[0].voting_power,
        downvote_manabar: response[0].downvote_manabar,
        follow_stats,
        reputation: reputationValue,
        profile
      };
    },
    enabled: !!username,
    staleTime: 6e4
  });
}
function getSearchAccountsByUsernameQueryOptions(query, limit = 5, excludeList = []) {
  return queryOptions({
    queryKey: ["accounts", "search", query, excludeList],
    enabled: !!query,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.database.call(
        "lookup_accounts",
        [query, limit]
      );
      return response.filter(
        (item) => excludeList.length > 0 ? !excludeList.includes(item) : true
      );
    }
  });
}
var RESERVED_META_KEYS = /* @__PURE__ */ new Set([
  "ownerPublicKey",
  "activePublicKey",
  "postingPublicKey",
  "memoPublicKey"
]);
function checkUsernameWalletsPendingQueryOptions(username, code) {
  return queryOptions({
    queryKey: [
      "accounts",
      "check-wallet-pending",
      username,
      code ?? null
    ],
    queryFn: async () => {
      if (!username || !code) {
        return { exist: false };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/wallets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            code
          })
        }
      );
      if (!response.ok) {
        return { exist: false };
      }
      const payload = await response.json();
      const wallets = Array.isArray(payload) ? payload.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }
        const walletItem = item;
        const symbol = typeof walletItem.token === "string" ? walletItem.token : void 0;
        if (!symbol) {
          return [];
        }
        const meta = walletItem.meta && typeof walletItem.meta === "object" ? { ...walletItem.meta } : {};
        const sanitizedMeta = {};
        const address = typeof walletItem.address === "string" && walletItem.address ? walletItem.address : void 0;
        const statusShow = typeof walletItem.status === "number" ? walletItem.status === 3 : void 0;
        const showFlag = statusShow ?? false;
        if (address) {
          sanitizedMeta.address = address;
        }
        sanitizedMeta.show = showFlag;
        const baseCandidate = {
          symbol,
          currency: symbol,
          address,
          show: showFlag,
          type: "CHAIN",
          meta: sanitizedMeta
        };
        const metaTokenCandidates = [];
        for (const [metaSymbol, metaValue] of Object.entries(meta)) {
          if (typeof metaSymbol !== "string") {
            continue;
          }
          if (RESERVED_META_KEYS.has(metaSymbol)) {
            continue;
          }
          if (typeof metaValue !== "string" || !metaValue) {
            continue;
          }
          if (!/^[A-Z0-9]{2,10}$/.test(metaSymbol)) {
            continue;
          }
          metaTokenCandidates.push({
            symbol: metaSymbol,
            currency: metaSymbol,
            address: metaValue,
            show: showFlag,
            type: "CHAIN",
            meta: { address: metaValue, show: showFlag }
          });
        }
        return [baseCandidate, ...metaTokenCandidates];
      }) : [];
      return {
        exist: wallets.length > 0,
        tokens: wallets.length ? wallets : void 0,
        wallets: wallets.length ? wallets : void 0
      };
    },
    refetchOnMount: true
  });
}
function getRelationshipBetweenAccountsQueryOptions(reference, target) {
  return queryOptions({
    queryKey: ["accounts", "relations", reference, target],
    enabled: !!reference && !!target,
    refetchOnMount: false,
    refetchInterval: 36e5,
    queryFn: async () => {
      return await CONFIG.hiveClient.call(
        "bridge",
        "get_relationship_between_accounts",
        [reference, target]
      );
    }
  });
}
function getAccountSubscriptionsQueryOptions(username) {
  return queryOptions({
    queryKey: ["accounts", "subscriptions", username],
    enabled: !!username,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "list_all_subscriptions",
        {
          account: username
        }
      );
      return response ?? [];
    }
  });
}
function getActiveAccountBookmarksQueryOptions(activeUsername) {
  return queryOptions({
    queryKey: ["accounts", "bookmarks", activeUsername],
    enabled: !!activeUsername,
    queryFn: async () => {
      if (!activeUsername) {
        throw new Error("[SDK][Accounts][Bookmarks] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: getAccessToken(activeUsername) })
        }
      );
      return await response.json();
    }
  });
}
function getActiveAccountFavouritesQueryOptions(activeUsername) {
  return queryOptions({
    queryKey: ["accounts", "favourites", activeUsername],
    enabled: !!activeUsername,
    queryFn: async () => {
      if (!activeUsername) {
        throw new Error("[SDK][Accounts][Favourites] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: getAccessToken(activeUsername) })
        }
      );
      return await response.json();
    }
  });
}
function getAccountRecoveriesQueryOptions(username) {
  return queryOptions({
    enabled: !!username,
    queryKey: ["accounts", "recoveries", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/recoveries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: getAccessToken(username) })
        }
      );
      return response.json();
    }
  });
}
function getAccountPendingRecoveryQueryOptions(username) {
  return queryOptions({
    enabled: !!username,
    queryKey: ["accounts", "recoveries", username, "pending-request"],
    queryFn: () => CONFIG.hiveClient.call(
      "database_api",
      "find_change_recovery_account_requests",
      { accounts: [username] }
    )
  });
}
function sanitizeTokens(tokens) {
  return tokens?.map(({ meta, ...rest }) => {
    if (!meta || typeof meta !== "object") {
      return { ...rest, meta };
    }
    const { privateKey, username, ...safeMeta } = meta;
    return { ...rest, meta: safeMeta };
  });
}
function parseProfileMetadata(postingJsonMetadata) {
  if (!postingJsonMetadata) {
    return {};
  }
  try {
    const parsed = JSON.parse(postingJsonMetadata);
    if (parsed && typeof parsed === "object" && parsed.profile && typeof parsed.profile === "object") {
      return parsed.profile;
    }
  } catch (err) {
  }
  return {};
}
function extractAccountProfile(data) {
  return parseProfileMetadata(data?.posting_json_metadata);
}
function buildProfileMetadata({
  existingProfile,
  profile,
  tokens
}) {
  const { tokens: profileTokens, version: _ignoredVersion, ...profileRest } = profile ?? {};
  const metadata = R4.mergeDeep(
    existingProfile ?? {},
    profileRest
  );
  const nextTokens = tokens ?? profileTokens;
  if (nextTokens && nextTokens.length > 0) {
    metadata.tokens = nextTokens;
  }
  metadata.tokens = sanitizeTokens(metadata.tokens);
  metadata.version = 2;
  return metadata;
}

// src/modules/accounts/mutations/use-account-update.ts
function useAccountUpdate(username) {
  const queryClient = useQueryClient();
  const { data } = useQuery(getAccountFullQueryOptions(username));
  return useBroadcastMutation(
    ["accounts", "update"],
    username,
    (payload) => {
      if (!data) {
        throw new Error("[SDK][Accounts] \u2013 cannot update not existing account");
      }
      const profile = buildProfileMetadata({
        existingProfile: extractAccountProfile(data),
        profile: payload.profile,
        tokens: payload.tokens
      });
      return [
        [
          "account_update2",
          {
            account: username,
            json_metadata: "",
            extensions: [],
            posting_json_metadata: JSON.stringify({
              profile
            })
          }
        ]
      ];
    },
    (_, variables) => queryClient.setQueryData(
      getAccountFullQueryOptions(username).queryKey,
      (data2) => {
        if (!data2) {
          return data2;
        }
        const obj = R4.clone(data2);
        obj.profile = buildProfileMetadata({
          existingProfile: extractAccountProfile(data2),
          profile: variables.profile,
          tokens: variables.tokens
        });
        return obj;
      }
    )
  );
}
function useAccountRelationsUpdate(reference, target, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "relation", "update", reference, target],
    mutationFn: async (kind) => {
      const relationsQuery = getRelationshipBetweenAccountsQueryOptions(
        reference,
        target
      );
      await getQueryClient().prefetchQuery(relationsQuery);
      const actualRelation = getQueryClient().getQueryData(
        relationsQuery.queryKey
      );
      await broadcastJson(reference, "follow", [
        "follow",
        {
          follower: reference,
          following: target,
          what: [
            ...kind === "toggle-ignore" && !actualRelation?.ignores ? ["ignore"] : [],
            ...kind === "toggle-follow" && !actualRelation?.follows ? ["blog"] : []
          ]
        }
      ]);
      return {
        ...actualRelation,
        ignores: kind === "toggle-ignore" ? !actualRelation?.ignores : actualRelation?.ignores,
        follows: kind === "toggle-follow" ? !actualRelation?.follows : actualRelation?.follows
      };
    },
    onError,
    onSuccess(data) {
      onSuccess(data);
      getQueryClient().setQueryData(
        ["accounts", "relations", reference, target],
        data
      );
    }
  });
}
function useBookmarkAdd(username, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "add", username],
    mutationFn: async ({ author, permlink }) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks-add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            author,
            permlink,
            code: getAccessToken(username)
          })
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "bookmarks", username]
      });
    },
    onError
  });
}
function useBookmarkDelete(username, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "delete", username],
    mutationFn: async (bookmarkId) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: bookmarkId,
            code: getAccessToken(username)
          })
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "bookmarks", username]
      });
    },
    onError
  });
}
function useAccountFavouriteAdd(username, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            account,
            code: getAccessToken(username)
          })
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "favourites", username]
      });
    },
    onError
  });
}
function useAccountFavouriteDelete(username, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            account,
            code: getAccessToken(username)
          })
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "favourites", username]
      });
    },
    onError
  });
}
function dedupeAndSortKeyAuths(existing, additions) {
  const merged = /* @__PURE__ */ new Map();
  existing.forEach(([key, weight]) => {
    merged.set(key.toString(), weight);
  });
  additions.forEach(([key, weight]) => {
    merged.set(key.toString(), weight);
  });
  return Array.from(merged.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([key, weight]) => [key, weight]);
}
function useAccountUpdateKeyAuths(username, options) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  return useMutation({
    mutationKey: ["accounts", "keys-update", username],
    mutationFn: async ({ keys, keepCurrent = false, currentKey }) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update keys for anon user"
        );
      }
      const prepareAuth = (keyName) => {
        const auth = R4.clone(accountData[keyName]);
        auth.key_auths = dedupeAndSortKeyAuths(
          keepCurrent ? auth.key_auths : [],
          keys.map(
            (values, i) => [values[keyName].createPublic().toString(), i + 1]
          )
        );
        return auth;
      };
      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: username,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          memo_key: keepCurrent ? accountData.memo_key : keys[0].memo_key.createPublic().toString()
        },
        currentKey
      );
    },
    ...options
  });
}
function useAccountUpdatePassword(username, options) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  const { mutateAsync: updateKeys } = useAccountUpdateKeyAuths(username);
  return useMutation({
    mutationKey: ["accounts", "password-update", username],
    mutationFn: async ({
      newPassword,
      currentPassword,
      keepCurrent
    }) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update password for anon user"
        );
      }
      const currentKey = PrivateKey.fromLogin(
        username,
        currentPassword,
        "owner"
      );
      return updateKeys({
        currentKey,
        keepCurrent,
        keys: [
          {
            owner: PrivateKey.fromLogin(username, newPassword, "owner"),
            active: PrivateKey.fromLogin(username, newPassword, "active"),
            posting: PrivateKey.fromLogin(username, newPassword, "posting"),
            memo_key: PrivateKey.fromLogin(username, newPassword, "memo")
          }
        ]
      });
    },
    ...options
  });
}
function useAccountRevokePosting(username, options) {
  const queryClient = useQueryClient();
  const { data } = useQuery(getAccountFullQueryOptions(username));
  return useMutation({
    mutationKey: ["accounts", "revoke-posting", data?.name],
    mutationFn: async ({ accountName, type, key }) => {
      if (!data) {
        throw new Error(
          "[SDK][Accounts] \u2013\xA0cannot revoke posting for anonymous user"
        );
      }
      const posting = R4.pipe(
        {},
        R4.mergeDeep(data.posting)
      );
      posting.account_auths = posting.account_auths.filter(
        ([account]) => account !== accountName
      );
      const operationBody = {
        account: data.name,
        posting,
        memo_key: data.memo_key,
        json_metadata: data.json_metadata
      };
      if (type === "key" && key) {
        return CONFIG.hiveClient.broadcast.updateAccount(operationBody, key);
      } else if (type === "keychain") {
        return keychain_exports.broadcast(
          data.name,
          [["account_update", operationBody]],
          "Active"
        );
      } else {
        const params = {
          callback: `https://ecency.com/@${data.name}/permissions`
        };
        return hs.sendOperation(
          ["account_update", operationBody],
          params,
          () => {
          }
        );
      }
    },
    onError: options.onError,
    onSuccess: (resp, payload, ctx) => {
      options.onSuccess?.(resp, payload, ctx);
      queryClient.setQueryData(
        getAccountFullQueryOptions(username).queryKey,
        (data2) => ({
          ...data2,
          posting: {
            ...data2?.posting,
            account_auths: data2?.posting?.account_auths?.filter(
              ([account]) => account !== payload.accountName
            ) ?? []
          }
        })
      );
    }
  });
}
function useAccountUpdateRecovery(username, options) {
  const { data } = useQuery(getAccountFullQueryOptions(username));
  return useMutation({
    mutationKey: ["accounts", "recovery", data?.name],
    mutationFn: async ({ accountName, type, key, email }) => {
      if (!data) {
        throw new Error(
          "[SDK][Accounts] \u2013\xA0cannot change recovery for anonymous user"
        );
      }
      const operationBody = {
        account_to_recover: data.name,
        new_recovery_account: accountName,
        extensions: []
      };
      if (type === "ecency") {
        const fetchApi = getBoundFetch();
        return fetchApi(CONFIG.privateApiHost + "/private-api/recoveries-add", {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(data.name),
            email,
            publicKeys: [
              ...data.owner.key_auths,
              ...data.active.key_auths,
              ...data.posting.key_auths,
              data.memo_key
            ]
          })
        });
      } else if (type === "key" && key) {
        return CONFIG.hiveClient.broadcast.sendOperations(
          [["change_recovery_account", operationBody]],
          key
        );
      } else if (type === "keychain") {
        return keychain_exports.broadcast(
          data.name,
          [["change_recovery_account", operationBody]],
          "Active"
        );
      } else {
        const params = {
          callback: `https://ecency.com/@${data.name}/permissions`
        };
        return hs.sendOperation(
          ["change_recovery_account", operationBody],
          params,
          () => {
          }
        );
      }
    },
    onError: options.onError,
    onSuccess: options.onSuccess
  });
}
function useAccountRevokeKey(username, options) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  return useMutation({
    mutationKey: ["accounts", "revoke-key", accountData?.name],
    mutationFn: async ({ currentKey, revokingKey }) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update keys for anon user"
        );
      }
      const prepareAuth = (keyName) => {
        const auth = R4.clone(accountData[keyName]);
        auth.key_auths = auth.key_auths.filter(
          ([key]) => key !== revokingKey.toString()
        );
        return auth;
      };
      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: accountData.name,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          memo_key: accountData.memo_key
        },
        currentKey
      );
    },
    ...options
  });
}
function useSignOperationByKey(username) {
  return useMutation({
    mutationKey: ["operations", "sign", username],
    mutationFn: ({
      operation,
      keyOrSeed
    }) => {
      if (!username) {
        throw new Error("[Operations][Sign] \u2013 cannot sign op with anon user");
      }
      let privateKey;
      if (keyOrSeed.split(" ").length === 12) {
        privateKey = PrivateKey.fromLogin(username, keyOrSeed, "active");
      } else if (cryptoUtils.isWif(keyOrSeed)) {
        privateKey = PrivateKey.fromString(keyOrSeed);
      } else {
        privateKey = PrivateKey.from(keyOrSeed);
      }
      return CONFIG.hiveClient.broadcast.sendOperations(
        [operation],
        privateKey
      );
    }
  });
}
function useSignOperationByKeychain(username, keyType = "Active") {
  return useMutation({
    mutationKey: ["operations", "sign-keychain", username],
    mutationFn: ({ operation }) => {
      if (!username) {
        throw new Error(
          "[SDK][Keychain] \u2013\xA0cannot sign operation with anon user"
        );
      }
      return keychain_exports.broadcast(username, [operation], keyType);
    }
  });
}
function useSignOperationByHivesigner(callbackUri = "/") {
  return useMutation({
    mutationKey: ["operations", "sign-hivesigner", callbackUri],
    mutationFn: async ({ operation }) => {
      return hs.sendOperation(operation, { callback: callbackUri }, () => {
      });
    }
  });
}
function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: ["operations", "chain-properties"],
    queryFn: async () => {
      return await CONFIG.hiveClient.database.getChainProperties();
    }
  });
}
function getTrendingTagsQueryOptions(limit = 20) {
  return infiniteQueryOptions({
    queryKey: ["posts", "trending-tags"],
    queryFn: async ({ pageParam: { afterTag } }) => CONFIG.hiveClient.database.call("get_trending_tags", [afterTag, limit]).then(
      (tags) => tags.filter((x) => x.name !== "").filter((x) => !x.name.startsWith("hive-")).map((x) => x.name)
    ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) => ({
      afterTag: lastPage?.[lastPage?.length - 1]
    }),
    staleTime: Infinity,
    refetchOnMount: true
  });
}
function getFragmentsQueryOptions(username) {
  return queryOptions({
    queryKey: ["posts", "fragments", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username)
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return response.json();
    },
    enabled: !!username
  });
}
function getPromotedPostsQuery(type = "feed") {
  return queryOptions({
    queryKey: ["posts", "promoted", type],
    queryFn: async () => {
      const url = new URL(
        CONFIG.privateApiHost + "/private-api/promoted-entries"
      );
      if (type === "waves") {
        url.searchParams.append("short_content", "1");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      return data;
    }
  });
}
function getEntryActiveVotesQueryOptions(entry) {
  return queryOptions({
    queryKey: ["posts", "entry-active-votes", entry?.author, entry?.permlink],
    queryFn: async () => {
      return CONFIG.hiveClient.database.call("get_active_votes", [
        entry?.author,
        entry?.permlink
      ]);
    },
    enabled: !!entry
  });
}
function getPostHeaderQueryOptions(author, permlink) {
  return queryOptions({
    queryKey: ["posts", "post-header", author, permlink],
    queryFn: async () => {
      return CONFIG.hiveClient.call("bridge", "get_post_header", {
        author,
        permlink
      });
    },
    initialData: null
  });
}
function makeEntryPath(category, author, permlink) {
  return `${category}/@${author}/${permlink}`;
}
function getPostQueryOptions(author, permlink, observer = "", num) {
  const cleanPermlink = permlink?.trim();
  const entryPath = makeEntryPath("", author, cleanPermlink ?? "");
  return queryOptions({
    queryKey: ["posts", "entry", entryPath],
    queryFn: async () => {
      if (!cleanPermlink || cleanPermlink === "undefined") {
        return null;
      }
      const response = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink: cleanPermlink,
        observer
      });
      if (response && num !== void 0) {
        return { ...response, num };
      }
      return response;
    },
    enabled: !!author && !!permlink && permlink.trim() !== "" && permlink.trim() !== "undefined"
  });
}
var SortOrder = /* @__PURE__ */ ((SortOrder2) => {
  SortOrder2["trending"] = "trending";
  SortOrder2["author_reputation"] = "author_reputation";
  SortOrder2["votes"] = "votes";
  SortOrder2["created"] = "created";
  return SortOrder2;
})(SortOrder || {});
function parseAsset2(value) {
  const match = value.match(/^(\d+\.?\d*)\s*([A-Z]+)$/);
  if (!match) return { amount: 0, symbol: "" };
  return {
    amount: parseFloat(match[1]),
    symbol: match[2]
  };
}
function sortDiscussions(entry, discussion, order) {
  const allPayout = (c) => parseAsset2(c.pending_payout_value).amount + parseAsset2(c.author_payout_value).amount + parseAsset2(c.curator_payout_value).amount;
  const absNegative = (a) => a.net_rshares < 0;
  const isPinned = (a) => entry.json_metadata?.pinned_reply === `${a.author}/${a.permlink}`;
  const sortOrders = {
    trending: (a, b) => {
      if (absNegative(a)) {
        return 1;
      }
      if (absNegative(b)) {
        return -1;
      }
      const _a = allPayout(a);
      const _b = allPayout(b);
      if (_a !== _b) {
        return _b - _a;
      }
      return 0;
    },
    author_reputation: (a, b) => {
      const keyA = a.author_reputation;
      const keyB = b.author_reputation;
      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    },
    votes: (a, b) => {
      const keyA = a.children;
      const keyB = b.children;
      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    },
    created: (a, b) => {
      if (absNegative(a)) {
        return 1;
      }
      if (absNegative(b)) {
        return -1;
      }
      const keyA = Date.parse(a.created);
      const keyB = Date.parse(b.created);
      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    }
  };
  const sorted = discussion.sort(sortOrders[order]);
  const pinnedIndex = sorted.findIndex((i) => isPinned(i));
  const pinned = sorted[pinnedIndex];
  if (pinnedIndex >= 0) {
    sorted.splice(pinnedIndex, 1);
    sorted.unshift(pinned);
  }
  return sorted;
}
function getDiscussionsQueryOptions(entry, order = "created" /* created */, enabled = true, observer) {
  return queryOptions({
    queryKey: [
      "posts",
      "discussions",
      entry?.author,
      entry?.permlink,
      order,
      observer || entry?.author
    ],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call("bridge", "get_discussion", {
        author: entry.author,
        permlink: entry.permlink,
        observer: observer || entry.author
      });
      const results = response ? Array.from(Object.values(response)) : [];
      return results;
    },
    enabled,
    select: (data) => sortDiscussions(entry, data, order)
  });
}
var DMCA_ACCOUNTS = [];
function getAccountPostsInfiniteQueryOptions(username, filter = "posts", limit = 20, observer = "", enabled = true) {
  return infiniteQueryOptions({
    queryKey: ["posts", "account-posts", username ?? "", filter, limit],
    enabled: !!username && enabled,
    initialPageParam: {
      author: void 0,
      permlink: void 0,
      hasNextPage: true
    },
    queryFn: async ({ pageParam }) => {
      if (!pageParam?.hasNextPage || !username) return [];
      const rpcParams = {
        sort: filter,
        account: username,
        limit,
        ...observer !== void 0 ? { observer } : {},
        ...pageParam.author ? { start_author: pageParam.author } : {},
        ...pageParam.permlink ? { start_permlink: pageParam.permlink } : {}
      };
      try {
        if (DMCA_ACCOUNTS.includes(username)) return [];
        const resp = await CONFIG.hiveClient.call(
          "bridge",
          "get_account_posts",
          rpcParams
        );
        if (resp && Array.isArray(resp)) {
          return resp;
        }
        return [];
      } catch (err) {
        console.error("[SDK] get_account_posts error:", err);
        return [];
      }
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage?.[lastPage.length - 1];
      const hasNextPage = (lastPage?.length ?? 0) > 0;
      if (!hasNextPage) {
        return void 0;
      }
      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage
      };
    }
  });
}
var DMCA_TAGS = [];
function getPostsRankedInfiniteQueryOptions(sort, tag, limit = 20, observer = "", enabled = true, _options = {}) {
  return infiniteQueryOptions({
    queryKey: ["posts", "posts-ranked", sort, tag, limit, observer],
    queryFn: async ({ pageParam }) => {
      if (!pageParam.hasNextPage) {
        return [];
      }
      let sanitizedTag = tag;
      if (DMCA_TAGS.some((rx) => new RegExp(rx).test(tag))) {
        sanitizedTag = "";
      }
      const response = await CONFIG.hiveClient.call("bridge", "get_ranked_posts", {
        sort,
        start_author: pageParam.author,
        start_permlink: pageParam.permlink,
        limit,
        tag: sanitizedTag,
        observer
      });
      if (response && Array.isArray(response)) {
        const data = response;
        const sorted = sort === "hot" ? data : data.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
        const pinnedEntry = sorted.find((s) => s.stats?.is_pinned);
        const nonPinnedEntries = sorted.filter((s) => !s.stats?.is_pinned);
        return [pinnedEntry, ...nonPinnedEntries].filter((s) => !!s);
      }
      return [];
    },
    enabled,
    initialPageParam: {
      author: void 0,
      permlink: void 0,
      hasNextPage: true
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage?.[lastPage.length - 1];
      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage: (lastPage?.length ?? 0) > 0
      };
    }
  });
}
function getReblogsQueryOptions(username, activeUsername, limit = 200) {
  return queryOptions({
    queryKey: ["posts", "reblogs", username ?? "", limit],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call("condenser_api", "get_blog_entries", [
        username ?? activeUsername,
        0,
        limit
      ]);
      return response.filter(
        (i) => i.author !== activeUsername && !i.reblogged_on.startsWith("1970-")
      ).map((i) => ({ author: i.author, permlink: i.permlink }));
    },
    enabled: !!username
  });
}
function useAddFragment(username) {
  return useMutation({
    mutationKey: ["posts", "add-fragment", username],
    mutationFn: async ({ title, body }) => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-add",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username),
            title,
            body
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return response.json();
    },
    onSuccess(response) {
      getQueryClient().setQueryData(
        getFragmentsQueryOptions(username).queryKey,
        (data) => [response, ...data ?? []]
      );
    }
  });
}
function useEditFragment(username, fragmentId) {
  return useMutation({
    mutationKey: ["posts", "edit-fragment", username, fragmentId],
    mutationFn: async ({ title, body }) => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-update",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username),
            id: fragmentId,
            title,
            body
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return response.json();
    },
    onSuccess(response) {
      getQueryClient().setQueryData(
        getFragmentsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return [];
          }
          const index = data.findIndex(({ id }) => id === fragmentId);
          if (index >= 0) {
            data[index] = response;
          }
          return [...data];
        }
      );
    }
  });
}
function useRemoveFragment(username, fragmentId) {
  return useMutation({
    mutationKey: ["posts", "remove-fragment", username],
    mutationFn: async () => {
      const fetchApi = getBoundFetch();
      return fetchApi(CONFIG.privateApiHost + "/private-api/fragments-delete", {
        method: "POST",
        body: JSON.stringify({
          code: getAccessToken(username),
          id: fragmentId
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
    },
    onSuccess() {
      getQueryClient().setQueryData(
        getFragmentsQueryOptions(username).queryKey,
        (data) => [...data ?? []].filter(({ id }) => id !== fragmentId)
      );
    }
  });
}

// src/modules/analytics/mutations/index.ts
var mutations_exports = {};
__export(mutations_exports, {
  useRecordActivity: () => useRecordActivity
});
function useRecordActivity(username, activityType) {
  return useMutation({
    mutationKey: ["analytics", activityType],
    mutationFn: async () => {
      if (!activityType) {
        throw new Error("[SDK][Analytics] \u2013 no activity type provided");
      }
      const fetchApi = getBoundFetch();
      await fetchApi(CONFIG.plausibleHost + "/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: activityType,
          url: window.location.href,
          domain: window.location.host,
          props: {
            username
          }
        })
      });
    }
  });
}

// src/modules/integrations/3speak/queries/index.ts
var queries_exports2 = {};
__export(queries_exports2, {
  getAccountTokenQueryOptions: () => getAccountTokenQueryOptions,
  getAccountVideosQueryOptions: () => getAccountVideosQueryOptions
});

// src/modules/integrations/hivesigner/queries/index.ts
var queries_exports = {};
__export(queries_exports, {
  getDecodeMemoQueryOptions: () => getDecodeMemoQueryOptions
});
function getDecodeMemoQueryOptions(username, memo) {
  return queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
      const accessToken = getAccessToken(username);
      if (accessToken) {
        const hsClient = new hs.Client({
          accessToken
        });
        return hsClient.decode(memo);
      }
    }
  });
}

// src/modules/integrations/hivesigner/index.ts
var HiveSignerIntegration = {
  queries: queries_exports
};

// src/modules/integrations/3speak/queries/get-account-token-query-options.ts
function getAccountTokenQueryOptions(username) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "authenticate", username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Integrations][3Speak] \u2013\xA0anon user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `https://studio.3speak.tv/mobile/login?username=${username}&hivesigner=true`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const memoQueryOptions = HiveSignerIntegration.queries.getDecodeMemoQueryOptions(
        username,
        (await response.json()).memo
      );
      await getQueryClient().prefetchQuery(memoQueryOptions);
      const { memoDecoded } = getQueryClient().getQueryData(
        memoQueryOptions.queryKey
      );
      return memoDecoded.replace("#", "");
    }
  });
}
function getAccountVideosQueryOptions(username) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "videos", username],
    enabled: !!username,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(
        getAccountTokenQueryOptions(username)
      );
      const token = getQueryClient().getQueryData(
        getAccountTokenQueryOptions(username).queryKey
      );
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `https://studio.3speak.tv/mobile/api/my-videos`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      return await response.json();
    }
  });
}

// src/modules/integrations/3speak/index.ts
var ThreeSpeakIntegration = {
  queries: queries_exports2
};
function getHivePoshLinksQueryOptions(username) {
  return queryOptions({
    queryKey: ["integrations", "hiveposh", "links", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `https://hiveposh.com/api/v0/linked-accounts/${username}`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      return {
        twitter: {
          username: data.twitter_username,
          profile: data.twitter_profile
        },
        reddit: {
          username: data.reddit_username,
          profile: data.reddit_profile
        }
      };
    }
  });
}
function getStatsQueryOptions({
  url,
  dimensions = [],
  metrics = ["visitors", "pageviews", "visit_duration"],
  enabled = true
}) {
  return queryOptions({
    queryKey: ["integrations", "plausible", url, dimensions, metrics],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(`https://ecency.com/api/stats`, {
        method: "POST",
        body: JSON.stringify({
          metrics,
          url: encodeURIComponent(url),
          dimensions
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      return await response.json();
    },
    enabled: !!url && enabled
  });
}
function getRcStatsQueryOptions() {
  return queryOptions({
    queryKey: ["resource-credits", "stats"],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "rc_api",
        "get_rc_stats",
        {}
      );
      return response.rc_stats;
    }
  });
}
function getAccountRcQueryOptions(username) {
  return queryOptions({
    queryKey: ["resource-credits", "account", username],
    queryFn: async () => {
      const rcClient = new RCAPI(CONFIG.hiveClient);
      return rcClient.findRCAccounts([username]);
    },
    enabled: !!username
  });
}
function getGameStatusCheckQueryOptions(username, gameType) {
  return queryOptions({
    queryKey: ["games", "status-check", gameType, username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Games] \u2013 anon user in status check");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/get-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code: getAccessToken(username)
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return await response.json();
    }
  });
}
function useGameClaim(username, gameType, key) {
  const { mutateAsync: recordActivity } = useRecordActivity(
    username,
    "spin-rolled"
  );
  return useMutation({
    mutationKey: ["games", "post", gameType, username],
    mutationFn: async () => {
      if (!username) {
        throw new Error("[SDK][Games] \u2013 anon user in game post");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/post-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code: getAccessToken(username),
            key
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return await response.json();
    },
    onSuccess() {
      recordActivity();
    }
  });
}
function getCommunitiesQueryOptions(sort, query, limit = 100, observer = void 0, enabled = true) {
  return queryOptions({
    queryKey: ["communities", "list", sort, query, limit],
    enabled,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "list_communities",
        {
          last: "",
          limit,
          sort: sort === "hot" ? "rank" : sort,
          query: query ? query : null,
          observer
        }
      );
      return response ? sort === "hot" ? response.sort(() => Math.random() - 0.5) : response : [];
    }
  });
}
function getCommunityContextQueryOptions(username, communityName) {
  return queryOptions({
    queryKey: ["community", "context", username, communityName],
    enabled: !!username && !!communityName,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "get_community_context",
        {
          account: username,
          name: communityName
        }
      );
      return {
        role: response?.role ?? "guest",
        subscribed: response?.subscribed ?? false
      };
    }
  });
}

// src/modules/communities/types/community.ts
var ROLES = /* @__PURE__ */ ((ROLES2) => {
  ROLES2["OWNER"] = "owner";
  ROLES2["ADMIN"] = "admin";
  ROLES2["MOD"] = "mod";
  ROLES2["MEMBER"] = "member";
  ROLES2["GUEST"] = "guest";
  ROLES2["MUTED"] = "muted";
  return ROLES2;
})(ROLES || {});
var roleMap = {
  ["owner" /* OWNER */]: [
    "admin" /* ADMIN */,
    "mod" /* MOD */,
    "member" /* MEMBER */,
    "guest" /* GUEST */,
    "muted" /* MUTED */
  ],
  ["admin" /* ADMIN */]: ["mod" /* MOD */, "member" /* MEMBER */, "guest" /* GUEST */, "muted" /* MUTED */],
  ["mod" /* MOD */]: ["member" /* MEMBER */, "guest" /* GUEST */, "muted" /* MUTED */]
};

// src/modules/communities/utils/index.ts
function getCommunityType(name, type_id) {
  if (name.startsWith("hive-3") || type_id === 3) return "Council";
  if (name.startsWith("hive-2") || type_id === 2) return "Journal";
  return "Topic";
}
function getCommunityPermissions({
  communityType,
  userRole,
  subscribed
}) {
  const canPost = (() => {
    if (userRole === "muted" /* MUTED */) return false;
    if (communityType === "Topic") return true;
    return ["owner" /* OWNER */, "admin" /* ADMIN */, "mod" /* MOD */, "member" /* MEMBER */].includes(
      userRole
    );
  })();
  const canComment = (() => {
    if (userRole === "muted" /* MUTED */) return false;
    switch (communityType) {
      case "Topic":
        return true;
      case "Journal":
        return userRole !== "guest" /* GUEST */ || subscribed;
      case "Council":
        return canPost;
    }
  })();
  const isModerator = ["owner" /* OWNER */, "admin" /* ADMIN */, "mod" /* MOD */].includes(userRole);
  return {
    canPost,
    canComment,
    isModerator
  };
}
function getNotificationsUnreadCountQueryOptions(activeUsername) {
  return queryOptions({
    queryKey: ["notifications", "unread", activeUsername],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/notifications/unread`,
        {
          body: JSON.stringify({ code: getAccessToken(activeUsername) }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      return data.count;
    },
    enabled: !!activeUsername,
    initialData: 0,
    refetchInterval: 6e4
  });
}
function getNotificationsInfiniteQueryOptions(activeUsername, filter = void 0) {
  return infiniteQueryOptions({
    queryKey: ["notifications", activeUsername, filter],
    queryFn: async ({ pageParam }) => {
      const data = {
        code: getAccessToken(activeUsername),
        filter,
        since: pageParam,
        user: void 0
      };
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );
      return response.json();
    },
    enabled: !!activeUsername,
    initialData: { pages: [], pageParams: [] },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.[lastPage.length - 1]?.id ?? "",
    refetchOnMount: true
  });
}

// src/modules/notifications/enums/notification-filter.ts
var NotificationFilter = /* @__PURE__ */ ((NotificationFilter2) => {
  NotificationFilter2["VOTES"] = "rvotes";
  NotificationFilter2["MENTIONS"] = "mentions";
  NotificationFilter2["FAVORITES"] = "nfavorites";
  NotificationFilter2["BOOKMARKS"] = "nbookmarks";
  NotificationFilter2["FOLLOWS"] = "follows";
  NotificationFilter2["REPLIES"] = "replies";
  NotificationFilter2["REBLOGS"] = "reblogs";
  NotificationFilter2["TRANSFERS"] = "transfers";
  NotificationFilter2["DELEGATIONS"] = "delegations";
  return NotificationFilter2;
})(NotificationFilter || {});

// src/modules/notifications/enums/notify-types.ts
var NotifyTypes = /* @__PURE__ */ ((NotifyTypes2) => {
  NotifyTypes2[NotifyTypes2["VOTE"] = 1] = "VOTE";
  NotifyTypes2[NotifyTypes2["MENTION"] = 2] = "MENTION";
  NotifyTypes2[NotifyTypes2["FOLLOW"] = 3] = "FOLLOW";
  NotifyTypes2[NotifyTypes2["COMMENT"] = 4] = "COMMENT";
  NotifyTypes2[NotifyTypes2["RE_BLOG"] = 5] = "RE_BLOG";
  NotifyTypes2[NotifyTypes2["TRANSFERS"] = 6] = "TRANSFERS";
  NotifyTypes2[NotifyTypes2["FAVORITES"] = 13] = "FAVORITES";
  NotifyTypes2[NotifyTypes2["BOOKMARKS"] = 15] = "BOOKMARKS";
  NotifyTypes2["ALLOW_NOTIFY"] = "ALLOW_NOTIFY";
  return NotifyTypes2;
})(NotifyTypes || {});
var ALL_NOTIFY_TYPES = [
  1 /* VOTE */,
  2 /* MENTION */,
  3 /* FOLLOW */,
  4 /* COMMENT */,
  5 /* RE_BLOG */,
  6 /* TRANSFERS */,
  13 /* FAVORITES */,
  15 /* BOOKMARKS */
];
var NotificationViewType = /* @__PURE__ */ ((NotificationViewType2) => {
  NotificationViewType2["ALL"] = "All";
  NotificationViewType2["UNREAD"] = "Unread";
  NotificationViewType2["READ"] = "Read";
  return NotificationViewType2;
})(NotificationViewType || {});

// src/modules/notifications/queries/get-notifications-settings-query-options.ts
function getNotificationsSettingsQueryOptions(activeUsername) {
  return queryOptions({
    queryKey: ["notifications", "settings", activeUsername],
    queryFn: async () => {
      let token = activeUsername + "-web";
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/detail-device",
        {
          body: JSON.stringify({
            code: getAccessToken(activeUsername),
            username: activeUsername,
            token
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return response.json();
    },
    enabled: !!activeUsername,
    refetchOnMount: false,
    initialData: () => {
      const wasMutedPreviously = localStorage.getItem("notifications") !== "true";
      return {
        status: 0,
        system: "web",
        allows_notify: 0,
        notify_types: wasMutedPreviously ? [] : [
          4 /* COMMENT */,
          3 /* FOLLOW */,
          2 /* MENTION */,
          13 /* FAVORITES */,
          15 /* BOOKMARKS */,
          1 /* VOTE */,
          5 /* RE_BLOG */,
          6 /* TRANSFERS */
        ]
      };
    }
  });
}

export { ALL_NOTIFY_TYPES, CONFIG, ConfigManager, mutations_exports as EcencyAnalytics, EcencyQueriesManager, HiveSignerIntegration, keychain_exports as Keychain, NaiMap, NotificationFilter, NotificationViewType, NotifyTypes, ROLES, SortOrder, Symbol2 as Symbol, ThreeSpeakIntegration, broadcastJson, buildProfileMetadata, checkUsernameWalletsPendingQueryOptions, decodeObj, dedupeAndSortKeyAuths, encodeObj, extractAccountProfile, getAccessToken, getAccountFullQueryOptions, getAccountPendingRecoveryQueryOptions, getAccountPostsInfiniteQueryOptions, getAccountRcQueryOptions, getAccountRecoveriesQueryOptions, getAccountSubscriptionsQueryOptions, getActiveAccountBookmarksQueryOptions, getActiveAccountFavouritesQueryOptions, getBoundFetch, getChainPropertiesQueryOptions, getCommunitiesQueryOptions, getCommunityContextQueryOptions, getCommunityPermissions, getCommunityType, getDiscussionsQueryOptions, getDynamicPropsQueryOptions, getEntryActiveVotesQueryOptions, getFragmentsQueryOptions, getGameStatusCheckQueryOptions, getHivePoshLinksQueryOptions, getLoginType, getNotificationsInfiniteQueryOptions, getNotificationsSettingsQueryOptions, getNotificationsUnreadCountQueryOptions, getPostHeaderQueryOptions, getPostQueryOptions, getPostingKey, getPostsRankedInfiniteQueryOptions, getPromotedPostsQuery, getQueryClient, getRcStatsQueryOptions, getReblogsQueryOptions, getRefreshToken, getRelationshipBetweenAccountsQueryOptions, getSearchAccountsByUsernameQueryOptions, getStatsQueryOptions, getTrendingTagsQueryOptions, getUser, makeQueryClient, parseAsset, parseProfileMetadata, roleMap, sortDiscussions, useAccountFavouriteAdd, useAccountFavouriteDelete, useAccountRelationsUpdate, useAccountRevokeKey, useAccountRevokePosting, useAccountUpdate, useAccountUpdateKeyAuths, useAccountUpdatePassword, useAccountUpdateRecovery, useAddFragment, useBookmarkAdd, useBookmarkDelete, useBroadcastMutation, useEditFragment, useGameClaim, useRemoveFragment, useSignOperationByHivesigner, useSignOperationByKey, useSignOperationByKeychain };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map