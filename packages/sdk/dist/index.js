import { QueryClient, useQuery, useInfiniteQuery, useMutation, queryOptions, useQueryClient, infiniteQueryOptions } from '@tanstack/react-query';
import { Client, PrivateKey, cryptoUtils, RCAPI } from '@hiveio/dhive';
import hs from 'hivesigner';
import * as R2 from 'remeda';

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
  heliusApiKey: import.meta.env.VITE_HELIUS_API_KEY,
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
        const response = await new hs.Client({
          accessToken: token
        }).broadcast(operations(payload));
        return response.result;
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
      const profile = JSON.parse(response[0].posting_json_metadata).profile;
      let follow_stats;
      try {
        follow_stats = await CONFIG.hiveClient.database.call(
          "get_follow_count",
          [username]
        );
      } catch (e) {
      }
      const reputation = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_reputations",
        [username, 1]
      );
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
        reputation: reputation[0].reputation,
        profile: {
          ...profile,
          reputation: reputation[0].reputation
        }
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
function checkUsernameWalletsPendingQueryOptions(username) {
  return queryOptions({
    queryKey: ["accounts", "check-wallet-pending", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/wallets-chkuser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username
          })
        }
      );
      return await response.json();
    },
    enabled: !!username,
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(
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
function getBuiltProfile({
  profile,
  tokens,
  data
}) {
  const metadata = R2.pipe(
    JSON.parse(data?.posting_json_metadata || "{}").profile,
    R2.mergeDeep(profile ?? {})
  );
  if (tokens && tokens.length > 0) {
    metadata.tokens = tokens;
  }
  metadata.tokens = sanitizeTokens(metadata.tokens);
  return metadata;
}
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
      return [
        [
          "account_update2",
          {
            account: username,
            json_metadata: "",
            extensions: [],
            posting_json_metadata: JSON.stringify({
              profile: getBuiltProfile({ ...payload, data })
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
        const obj = R2.clone(data2);
        obj.profile = getBuiltProfile({ ...variables, data: data2 });
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(
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
  const map = R2.fromEntries(
    existing.map(([key, weight]) => [key.toString(), weight])
  );
  return R2.pipe(
    map,
    R2.merge(R2.fromEntries(additions)),
    R2.entries(),
    R2.sortBy(([key]) => key)
  );
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
        const auth = R2.clone(accountData[keyName]);
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
      const posting = R2.pipe(
        {},
        R2.mergeDeep(data.posting)
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
        return fetch(CONFIG.privateApiHost + "/private-api/recoveries-add", {
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
        const auth = R2.clone(accountData[keyName]);
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
      const response = await fetch(
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
      const response = await fetch(url.toString(), {
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
function useAddFragment(username) {
  return useMutation({
    mutationKey: ["posts", "add-fragment", username],
    mutationFn: async ({ title, body }) => {
      const response = await fetch(
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
      const response = await fetch(
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
    mutationFn: async () => fetch(CONFIG.privateApiHost + "/private-api/fragments-delete", {
      method: "POST",
      body: JSON.stringify({
        code: getAccessToken(username),
        id: fragmentId
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }),
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
      await fetch(CONFIG.plausibleHost + "/api/event", {
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch(`https://ecency.com/api/stats`, {
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
      const response = await fetch(
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
      const response = await fetch(
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

export { CONFIG, ConfigManager, mutations_exports as EcencyAnalytics, EcencyQueriesManager, HiveSignerIntegration, keychain_exports as Keychain, ROLES, ThreeSpeakIntegration, broadcastJson, checkUsernameWalletsPendingQueryOptions, dedupeAndSortKeyAuths, getAccessToken, getAccountFullQueryOptions, getAccountPendingRecoveryQueryOptions, getAccountRcQueryOptions, getAccountRecoveriesQueryOptions, getAccountSubscriptionsQueryOptions, getActiveAccountBookmarksQueryOptions, getActiveAccountFavouritesQueryOptions, getChainPropertiesQueryOptions, getCommunitiesQueryOptions, getCommunityContextQueryOptions, getCommunityPermissions, getCommunityType, getDynamicPropsQueryOptions, getFragmentsQueryOptions, getGameStatusCheckQueryOptions, getHivePoshLinksQueryOptions, getLoginType, getPostingKey, getPromotedPostsQuery, getQueryClient, getRcStatsQueryOptions, getRefreshToken, getRelationshipBetweenAccountsQueryOptions, getSearchAccountsByUsernameQueryOptions, getStatsQueryOptions, getTrendingTagsQueryOptions, getUser, makeQueryClient, roleMap, useAccountFavouriteAdd, useAccountFavouriteDelete, useAccountRelationsUpdate, useAccountRevokeKey, useAccountRevokePosting, useAccountUpdate, useAccountUpdateKeyAuths, useAccountUpdatePassword, useAccountUpdateRecovery, useAddFragment, useBookmarkAdd, useBookmarkDelete, useBroadcastMutation, useEditFragment, useGameClaim, useRemoveFragment, useSignOperationByHivesigner, useSignOperationByKey, useSignOperationByKeychain };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map