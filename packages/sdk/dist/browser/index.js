import { QueryClient, useQuery, useInfiniteQuery, useMutation, queryOptions, infiniteQueryOptions, useQueryClient } from '@tanstack/react-query';
import { Client, utils, PrivateKey, cryptoUtils, RCAPI } from '@hiveio/dhive';
import hs from 'hivesigner';
import * as R4 from 'remeda';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
function useBroadcastMutation(mutationKey = [], username, operations, onSuccess = () => {
}, auth) {
  return useMutation({
    onSuccess,
    mutationKey: [...mutationKey, username],
    mutationFn: async (payload) => {
      if (!username) {
        throw new Error(
          "[Core][Broadcast] Attempted to call broadcast API with anon user"
        );
      }
      if (auth?.broadcast) {
        return auth.broadcast(operations(payload), "posting");
      }
      const postingKey = auth?.postingKey;
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);
        return CONFIG.hiveClient.broadcast.sendOperations(
          operations(payload),
          privateKey
        );
      }
      const accessToken = auth?.accessToken;
      if (accessToken) {
        const ops2 = operations(payload);
        const client = new hs.Client({ accessToken });
        const response = await client.broadcast(ops2);
        return response.result;
      }
      throw new Error(
        "[SDK][Broadcast] \u2013 cannot broadcast w/o posting key or token"
      );
    }
  });
}
var CONFIG = {
  privateApiHost: "https://ecency.com",
  imageHost: "https://images.ecency.com",
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
  spkNode: "https://spk.good-karma.xyz",
  // DMCA filtering - can be configured by the app
  dmcaAccounts: [],
  dmcaTags: [],
  dmcaPatterns: [],
  // Pre-compiled regex patterns for performance and security
  dmcaTagRegexes: [],
  dmcaPatternRegexes: [],
  // Track if DMCA has been initialized to avoid duplicate logs
  _dmcaInitialized: false
};
var ConfigManager;
((ConfigManager2) => {
  function setQueryClient(client) {
    CONFIG.queryClient = client;
  }
  ConfigManager2.setQueryClient = setQueryClient;
  function setPrivateApiHost(host) {
    CONFIG.privateApiHost = host;
  }
  ConfigManager2.setPrivateApiHost = setPrivateApiHost;
  function setImageHost(host) {
    CONFIG.imageHost = host;
  }
  ConfigManager2.setImageHost = setImageHost;
  function analyzeRedosRisk(pattern) {
    if (/(\([^)]*[*+{][^)]*\))[*+{]/.test(pattern)) {
      return { safe: false, reason: "nested quantifiers detected" };
    }
    if (/\([^|)]*\|[^)]*\)[*+{]/.test(pattern)) {
      return { safe: false, reason: "alternation with quantifier (potential overlap)" };
    }
    if (/\([^)]*[*+][^)]*\)[*+]/.test(pattern)) {
      return { safe: false, reason: "repeated quantifiers (catastrophic backtracking risk)" };
    }
    if (/\.\*\.\*/.test(pattern) || /\.\+\.\+/.test(pattern)) {
      return { safe: false, reason: "multiple greedy quantifiers on wildcards" };
    }
    const unboundedRange = /\.?\{(\d+),(\d+)\}/g;
    let match;
    while ((match = unboundedRange.exec(pattern)) !== null) {
      const [, min, max] = match;
      const range = parseInt(max, 10) - parseInt(min, 10);
      if (range > 1e3) {
        return { safe: false, reason: `excessive range: {${min},${max}}` };
      }
    }
    return { safe: true };
  }
  function testRegexPerformance(regex) {
    const adversarialInputs = [
      // Nested quantifier attack
      "a".repeat(50) + "x",
      // Alternation attack
      "ab".repeat(50) + "x",
      // Wildcard attack
      "x".repeat(100),
      // Mixed attack
      "aaa".repeat(30) + "bbb".repeat(30) + "x"
    ];
    const maxExecutionTime = 5;
    for (const input of adversarialInputs) {
      const start = Date.now();
      try {
        regex.test(input);
        const duration = Date.now() - start;
        if (duration > maxExecutionTime) {
          return {
            safe: false,
            reason: `runtime test exceeded ${maxExecutionTime}ms (took ${duration}ms on input length ${input.length})`
          };
        }
      } catch (err) {
        return { safe: false, reason: `runtime test threw error: ${err}` };
      }
    }
    return { safe: true };
  }
  function safeCompileRegex(pattern, maxLength = 200) {
    try {
      if (!pattern) {
        console.warn(`[SDK] DMCA pattern rejected: empty pattern`);
        return null;
      }
      if (pattern.length > maxLength) {
        console.warn(`[SDK] DMCA pattern rejected: length ${pattern.length} exceeds max ${maxLength} - pattern: ${pattern.substring(0, 50)}...`);
        return null;
      }
      const staticAnalysis = analyzeRedosRisk(pattern);
      if (!staticAnalysis.safe) {
        console.warn(`[SDK] DMCA pattern rejected: static analysis failed (${staticAnalysis.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        return null;
      }
      let regex;
      try {
        regex = new RegExp(pattern);
      } catch (compileErr) {
        console.warn(`[SDK] DMCA pattern rejected: compilation failed - pattern: ${pattern.substring(0, 50)}...`, compileErr);
        return null;
      }
      const runtimeTest = testRegexPerformance(regex);
      if (!runtimeTest.safe) {
        console.warn(`[SDK] DMCA pattern rejected: runtime test failed (${runtimeTest.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        return null;
      }
      return regex;
    } catch (err) {
      console.warn(`[SDK] DMCA pattern rejected: unexpected error - pattern: ${pattern.substring(0, 50)}...`, err);
      return null;
    }
  }
  function setDmcaLists(accounts = [], tags = [], patterns = []) {
    CONFIG.dmcaAccounts = accounts;
    CONFIG.dmcaTags = tags;
    CONFIG.dmcaPatterns = patterns;
    CONFIG.dmcaTagRegexes = tags.map((pattern) => safeCompileRegex(pattern)).filter((r) => r !== null);
    CONFIG.dmcaPatternRegexes = [];
    const rejectedTagCount = tags.length - CONFIG.dmcaTagRegexes.length;
    if (!CONFIG._dmcaInitialized) {
      console.log(`[SDK] DMCA configuration loaded:`);
      console.log(`  - Accounts: ${accounts.length}`);
      console.log(`  - Tag patterns: ${CONFIG.dmcaTagRegexes.length}/${tags.length} compiled (${rejectedTagCount} rejected)`);
      console.log(`  - Post patterns: ${patterns.length} (using exact string matching)`);
      if (rejectedTagCount > 0) {
        console.warn(`[SDK] ${rejectedTagCount} DMCA tag patterns were rejected due to security validation. Check warnings above for details.`);
      }
      CONFIG._dmcaInitialized = true;
    }
  }
  ConfigManager2.setDmcaLists = setDmcaLists;
})(ConfigManager || (ConfigManager = {}));
async function broadcastJson(username, id, payload, auth) {
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
  if (auth?.broadcast) {
    return auth.broadcast([["custom_json", jjson]], "posting");
  }
  const postingKey = auth?.postingKey;
  if (postingKey) {
    const privateKey = PrivateKey.fromString(postingKey);
    return CONFIG.hiveClient.broadcast.json(
      jjson,
      privateKey
    );
  }
  const accessToken = auth?.accessToken;
  if (accessToken) {
    const response = await new hs.Client({
      accessToken
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

// src/modules/core/utils/is-community.ts
function isCommunity(value) {
  return typeof value === "string" ? /^hive-\d+$/.test(value) : false;
}

// src/modules/core/queries/get-dynamic-props-query-options.ts
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

// src/modules/accounts/utils/parse-accounts.ts
function parseAccounts(rawAccounts) {
  return rawAccounts.map((x) => {
    const account = {
      name: x.name,
      owner: x.owner,
      active: x.active,
      posting: x.posting,
      memo_key: x.memo_key,
      post_count: x.post_count,
      created: x.created,
      reputation: x.reputation,
      posting_json_metadata: x.posting_json_metadata,
      last_vote_time: x.last_vote_time,
      last_post: x.last_post,
      json_metadata: x.json_metadata,
      reward_hive_balance: x.reward_hive_balance,
      reward_hbd_balance: x.reward_hbd_balance,
      reward_vesting_hive: x.reward_vesting_hive,
      reward_vesting_balance: x.reward_vesting_balance,
      balance: x.balance,
      hbd_balance: x.hbd_balance,
      savings_balance: x.savings_balance,
      savings_hbd_balance: x.savings_hbd_balance,
      savings_hbd_last_interest_payment: x.savings_hbd_last_interest_payment,
      savings_hbd_seconds_last_update: x.savings_hbd_seconds_last_update,
      savings_hbd_seconds: x.savings_hbd_seconds,
      next_vesting_withdrawal: x.next_vesting_withdrawal,
      pending_claimed_accounts: x.pending_claimed_accounts,
      vesting_shares: x.vesting_shares,
      delegated_vesting_shares: x.delegated_vesting_shares,
      received_vesting_shares: x.received_vesting_shares,
      vesting_withdraw_rate: x.vesting_withdraw_rate,
      to_withdraw: x.to_withdraw,
      withdrawn: x.withdrawn,
      witness_votes: x.witness_votes,
      proxy: x.proxy,
      recovery_account: x.recovery_account,
      proxied_vsf_votes: x.proxied_vsf_votes,
      voting_manabar: x.voting_manabar,
      voting_power: x.voting_power,
      downvote_manabar: x.downvote_manabar
    };
    let profile = parseProfileMetadata(
      x.posting_json_metadata
    );
    if (!profile || Object.keys(profile).length === 0) {
      try {
        const jsonMetadata = JSON.parse(x.json_metadata || "{}");
        if (jsonMetadata.profile) {
          profile = jsonMetadata.profile;
        }
      } catch (e) {
      }
    }
    if (!profile || Object.keys(profile).length === 0) {
      profile = {
        about: "",
        cover_image: "",
        location: "",
        name: "",
        profile_image: "",
        website: ""
      };
    }
    return { ...account, profile };
  });
}

// src/modules/accounts/queries/get-accounts-query-options.ts
function getAccountsQueryOptions(usernames) {
  return queryOptions({
    queryKey: ["accounts", "list", ...usernames],
    enabled: usernames.length > 0,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.database.getAccounts(
        usernames
      );
      return parseAccounts(response);
    }
  });
}
function getFollowCountQueryOptions(username) {
  return queryOptions({
    queryKey: ["accounts", "follow-count", username],
    queryFn: () => CONFIG.hiveClient.database.call("get_follow_count", [
      username
    ])
  });
}
function getFollowingQueryOptions(follower, startFollowing, followType = "blog", limit = 100) {
  return queryOptions({
    queryKey: ["accounts", "following", follower, startFollowing, followType, limit],
    queryFn: () => CONFIG.hiveClient.database.call("get_following", [
      follower,
      startFollowing,
      followType,
      limit
    ]),
    enabled: !!follower
  });
}
function getMutedUsersQueryOptions(username, limit = 100) {
  return queryOptions({
    queryKey: ["accounts", "muted-users", username],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.database.call("get_following", [
        username,
        "",
        "ignore",
        limit
      ]);
      return response.map((user) => user.following);
    },
    enabled: !!username
  });
}
function lookupAccountsQueryOptions(query, limit = 50) {
  return queryOptions({
    queryKey: ["accounts", "lookup", query, limit],
    queryFn: () => CONFIG.hiveClient.database.call("lookup_accounts", [
      query,
      limit
    ]),
    enabled: !!query,
    staleTime: Infinity
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
function getActiveAccountBookmarksQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["accounts", "bookmarks", activeUsername],
    enabled: !!activeUsername && !!code,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Bookmarks] \u2013 missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        }
      );
      return await response.json();
    }
  });
}
function getActiveAccountFavouritesQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["accounts", "favourites", activeUsername],
    enabled: !!activeUsername && !!code,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Favourites] \u2013 missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        }
      );
      return await response.json();
    }
  });
}
function getAccountRecoveriesQueryOptions(username, code) {
  return queryOptions({
    enabled: !!username && !!code,
    queryKey: ["accounts", "recoveries", username],
    queryFn: async () => {
      if (!username || !code) {
        throw new Error("[SDK][Accounts] Missing username or access token");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/recoveries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
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
function getAccountReputationsQueryOptions(query, limit = 50) {
  return queryOptions({
    queryKey: ["accounts", "reputations", query, limit],
    enabled: !!query,
    queryFn: async () => {
      if (!query) {
        return [];
      }
      return CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_reputations",
        [query, limit]
      );
    }
  });
}
var ops = utils.operationOrders;
var ACCOUNT_OPERATION_GROUPS = {
  transfers: [
    ops.transfer,
    ops.transfer_to_savings,
    ops.transfer_from_savings,
    ops.cancel_transfer_from_savings,
    ops.recurrent_transfer,
    ops.fill_recurrent_transfer,
    ops.escrow_transfer,
    ops.fill_recurrent_transfer
  ],
  "market-orders": [
    ops.fill_convert_request,
    ops.fill_order,
    ops.fill_collateralized_convert_request,
    ops.limit_order_create2,
    ops.limit_order_create,
    ops.limit_order_cancel
  ],
  interests: [ops.interest],
  "stake-operations": [
    ops.return_vesting_delegation,
    ops.withdraw_vesting,
    ops.transfer_to_vesting,
    ops.set_withdraw_vesting_route,
    ops.update_proposal_votes,
    ops.fill_vesting_withdraw,
    ops.account_witness_proxy,
    ops.delegate_vesting_shares
  ],
  rewards: [
    ops.author_reward,
    ops.curation_reward,
    ops.producer_reward,
    ops.claim_reward_balance,
    ops.comment_benefactor_reward,
    ops.liquidity_reward,
    ops.proposal_pay
  ]
};
var ALL_ACCOUNT_OPERATIONS = [...Object.values(ACCOUNT_OPERATION_GROUPS)].reduce(
  (acc, val) => acc.concat(val),
  []
);
function getTransactionsInfiniteQueryOptions(username, limit = 20, group = "") {
  return infiniteQueryOptions({
    queryKey: ["accounts", "transactions", username ?? "", group, limit],
    initialPageParam: -1,
    queryFn: async ({ pageParam }) => {
      if (!username) {
        return [];
      }
      let filters;
      switch (group) {
        case "transfers":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["transfers"]);
          break;
        case "market-orders":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["market-orders"]);
          break;
        case "interests":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["interests"]);
          break;
        case "stake-operations":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["stake-operations"]);
          break;
        case "rewards":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["rewards"]);
          break;
        default:
          filters = utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS);
      }
      const response = await (filters ? CONFIG.hiveClient.call("condenser_api", "get_account_history", [
        username,
        pageParam,
        limit,
        ...filters
      ]) : CONFIG.hiveClient.call("condenser_api", "get_account_history", [
        username,
        pageParam,
        limit
      ]));
      const mapped = response.map(([num, operation]) => {
        const base = {
          num,
          type: operation.op[0],
          timestamp: operation.timestamp,
          trx_id: operation.trx_id
        };
        const payload = operation.op[1];
        return { ...base, ...payload };
      }).filter(Boolean).sort((a, b) => b.num - a.num);
      return mapped;
    },
    getNextPageParam: (lastPage) => lastPage?.length ? (lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1
  });
}
function getBotsQueryOptions() {
  return queryOptions({
    queryKey: ["accounts", "bots"],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/public/bots", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.status}`);
      }
      return response.json();
    },
    refetchOnMount: true,
    staleTime: Infinity
  });
}
function getReferralsInfiniteQueryOptions(username) {
  return infiniteQueryOptions({
    queryKey: ["accounts", "referrals", username],
    initialPageParam: { maxId: void 0 },
    queryFn: async ({ pageParam }) => {
      const { maxId } = pageParam ?? {};
      const url = new URL(CONFIG.privateApiHost + `/private-api/referrals/${username}`);
      if (maxId !== void 0) {
        url.searchParams.set("max_id", maxId.toString());
      }
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch referrals: ${response.status}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      const nextMaxId = lastPage?.[lastPage.length - 1]?.id;
      return typeof nextMaxId === "number" ? { maxId: nextMaxId } : void 0;
    }
  });
}
function getReferralsStatsQueryOptions(username) {
  return queryOptions({
    queryKey: ["accounts", "referrals-stats", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/referrals/${username}/stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch referral stats: ${response.status}`);
      }
      const data = await response.json();
      if (!data) {
        throw new Error("No Referrals for this user!");
      }
      return {
        total: data.total ?? 0,
        rewarded: data.rewarded ?? 0
      };
    }
  });
}
function getFriendsInfiniteQueryOptions(following, mode, options) {
  const { followType = "blog", limit = 100, enabled = true } = options ?? {};
  return infiniteQueryOptions({
    queryKey: ["accounts", "friends", following, mode, followType, limit],
    initialPageParam: { startFollowing: "" },
    enabled,
    refetchOnMount: true,
    queryFn: async ({ pageParam }) => {
      const { startFollowing } = pageParam;
      const response = await CONFIG.hiveClient.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [following, startFollowing === "" ? null : startFollowing, followType, limit]
      );
      const accountNames = response.map(
        (e) => mode === "following" ? e.following : e.follower
      );
      const accounts = await CONFIG.hiveClient.call("bridge", "get_profiles", {
        accounts: accountNames,
        observer: void 0
      });
      const rows = (accounts ?? []).map((a) => ({
        name: a.name,
        reputation: a.reputation,
        active: a.active
        // Return raw timestamp
      }));
      return rows;
    },
    getNextPageParam: (lastPage) => lastPage && lastPage.length === limit ? { startFollowing: lastPage[lastPage.length - 1].name } : void 0
  });
}
var SEARCH_LIMIT = 30;
function getSearchFriendsQueryOptions(username, mode, query) {
  return queryOptions({
    queryKey: ["accounts", "friends", "search", username, mode, query],
    refetchOnMount: false,
    enabled: false,
    // Manual query via refetch
    queryFn: async () => {
      if (!query) return [];
      const start = query.slice(0, -1);
      const response = await CONFIG.hiveClient.database.call(
        mode === "following" ? "get_following" : "get_followers",
        [username, start, "blog", 1e3]
      );
      const accountNames = response.map((e) => mode === "following" ? e.following : e.follower).filter((name) => name.toLowerCase().includes(query.toLowerCase())).slice(0, SEARCH_LIMIT);
      const accounts = await CONFIG.hiveClient.call("bridge", "get_profiles", {
        accounts: accountNames,
        observer: void 0
      });
      return accounts?.map((a) => ({
        name: a.name,
        full_name: a.metadata.profile?.name || "",
        reputation: a.reputation,
        active: a.active
        // Return raw timestamp
      })) ?? [];
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
function getTrendingTagsWithStatsQueryOptions(limit = 250) {
  return infiniteQueryOptions({
    queryKey: ["posts", "trending-tags", "stats", limit],
    queryFn: async ({ pageParam: { afterTag } }) => CONFIG.hiveClient.database.call("get_trending_tags", [afterTag, limit]).then(
      (tags) => tags.filter((tag) => tag.name !== "").filter((tag) => !isCommunity(tag.name))
    ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) => lastPage?.length ? { afterTag: lastPage[lastPage.length - 1].name } : void 0,
    staleTime: Infinity,
    refetchOnMount: true
  });
}
function getFragmentsQueryOptions(username, code) {
  return queryOptions({
    queryKey: ["posts", "fragments", username],
    queryFn: async () => {
      if (!code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments",
        {
          method: "POST",
          body: JSON.stringify({
            code
          }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return response.json();
    },
    enabled: !!username && !!code
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
function getContentQueryOptions(author, permlink) {
  return queryOptions({
    queryKey: ["posts", "content", author, permlink],
    enabled: !!author && !!permlink,
    queryFn: async () => CONFIG.hiveClient.call("condenser_api", "get_content", [
      author,
      permlink
    ])
  });
}
function getContentRepliesQueryOptions(author, permlink) {
  return queryOptions({
    queryKey: ["posts", "content-replies", author, permlink],
    enabled: !!author && !!permlink,
    queryFn: async () => CONFIG.hiveClient.call("condenser_api", "get_content_replies", {
      author,
      permlink
    })
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

// src/modules/posts/utils/filter-dmca-entries.ts
function filterDmcaEntry(entryOrEntries) {
  if (Array.isArray(entryOrEntries)) {
    return entryOrEntries.map((entry) => applyFilter(entry));
  }
  return applyFilter(entryOrEntries);
}
function applyFilter(entry) {
  if (!entry) return entry;
  const entryPath = `@${entry.author}/${entry.permlink}`;
  const isDmca = CONFIG.dmcaPatternRegexes.some((regex) => regex.test(entryPath));
  if (isDmca) {
    return {
      ...entry,
      body: "This post is not available due to a copyright/fraudulent claim.",
      title: ""
    };
  }
  return entry;
}

// src/modules/posts/queries/get-post-query-options.ts
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
      if (!response) {
        return null;
      }
      const entry = num !== void 0 ? { ...response, num } : response;
      return filterDmcaEntry(entry);
    },
    enabled: !!author && !!permlink && permlink.trim() !== "" && permlink.trim() !== "undefined"
  });
}

// src/modules/bridge/requests.ts
function bridgeApiCall(endpoint, params) {
  return CONFIG.hiveClient.call("bridge", endpoint, params);
}
async function resolvePost(post, observer, num) {
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
          num
        };
      }
      return post;
    } catch {
      return post;
    }
  }
  return { ...post, num };
}
async function resolvePosts(posts, observer) {
  const validatedPosts = posts.map(validateEntry);
  const resolved = await Promise.all(validatedPosts.map((p) => resolvePost(p, observer)));
  return filterDmcaEntry(resolved);
}
async function getPostsRanked(sort, start_author = "", start_permlink = "", limit = 20, tag = "", observer = "") {
  const resp = await bridgeApiCall("get_ranked_posts", {
    sort,
    start_author,
    start_permlink,
    limit,
    tag,
    observer
  });
  if (resp) {
    return resolvePosts(resp, observer);
  }
  return resp;
}
async function getAccountPosts(sort, account, start_author = "", start_permlink = "", limit = 20, observer = "") {
  if (CONFIG.dmcaAccounts.includes(account)) {
    return [];
  }
  const resp = await bridgeApiCall("get_account_posts", {
    sort,
    account,
    start_author,
    start_permlink,
    limit,
    observer
  });
  if (resp) {
    return resolvePosts(resp, observer);
  }
  return resp;
}
function validateEntry(entry) {
  const newEntry = {
    ...entry,
    active_votes: Array.isArray(entry.active_votes) ? [...entry.active_votes] : [],
    beneficiaries: Array.isArray(entry.beneficiaries) ? [...entry.beneficiaries] : [],
    blacklists: Array.isArray(entry.blacklists) ? [...entry.blacklists] : [],
    replies: Array.isArray(entry.replies) ? [...entry.replies] : [],
    stats: entry.stats ? { ...entry.stats } : null
  };
  const requiredStringProps = [
    "author",
    "title",
    "body",
    "created",
    "category",
    "permlink",
    "url",
    "updated"
  ];
  for (const prop of requiredStringProps) {
    if (newEntry[prop] == null) {
      newEntry[prop] = "";
    }
  }
  if (newEntry.author_reputation == null) {
    newEntry.author_reputation = 0;
  }
  if (newEntry.children == null) {
    newEntry.children = 0;
  }
  if (newEntry.depth == null) {
    newEntry.depth = 0;
  }
  if (newEntry.net_rshares == null) {
    newEntry.net_rshares = 0;
  }
  if (newEntry.payout == null) {
    newEntry.payout = 0;
  }
  if (newEntry.percent_hbd == null) {
    newEntry.percent_hbd = 0;
  }
  if (!newEntry.stats) {
    newEntry.stats = {
      flag_weight: 0,
      gray: false,
      hide: false,
      total_votes: 0
    };
  }
  if (newEntry.author_payout_value == null) {
    newEntry.author_payout_value = "0.000 HBD";
  }
  if (newEntry.curator_payout_value == null) {
    newEntry.curator_payout_value = "0.000 HBD";
  }
  if (newEntry.max_accepted_payout == null) {
    newEntry.max_accepted_payout = "1000000.000 HBD";
  }
  if (newEntry.payout_at == null) {
    newEntry.payout_at = "";
  }
  if (newEntry.pending_payout_value == null) {
    newEntry.pending_payout_value = "0.000 HBD";
  }
  if (newEntry.promoted == null) {
    newEntry.promoted = "0.000 HBD";
  }
  if (newEntry.is_paidout == null) {
    newEntry.is_paidout = false;
  }
  return newEntry;
}
async function getPost(author = "", permlink = "", observer = "", num) {
  const resp = await bridgeApiCall("get_post", {
    author,
    permlink,
    observer
  });
  if (resp) {
    const validatedEntry = validateEntry(resp);
    const post = await resolvePost(validatedEntry, observer, num);
    return filterDmcaEntry(post);
  }
  return void 0;
}
async function getPostHeader(author = "", permlink = "") {
  const resp = await bridgeApiCall("get_post_header", {
    author,
    permlink
  });
  return resp ? validateEntry(resp) : resp;
}
async function getDiscussion(author, permlink, observer) {
  const resp = await bridgeApiCall("get_discussion", {
    author,
    permlink,
    observer: observer || author
  });
  if (resp) {
    const validatedResp = {};
    for (const [key, entry] of Object.entries(resp)) {
      validatedResp[key] = validateEntry(entry);
    }
    return validatedResp;
  }
  return resp;
}
async function getCommunity(name, observer = "") {
  return bridgeApiCall("get_community", { name, observer });
}
async function getCommunities(last = "", limit = 100, query, sort = "rank", observer = "") {
  return bridgeApiCall("list_communities", {
    last,
    limit,
    query,
    sort,
    observer
  });
}
async function normalizePost(post) {
  const resp = await bridgeApiCall("normalize_post", { post });
  return resp ? validateEntry(resp) : resp;
}
async function getSubscriptions(account) {
  return bridgeApiCall("list_all_subscriptions", { account });
}
async function getSubscribers(community) {
  return bridgeApiCall("list_subscribers", { community });
}
async function getRelationshipBetweenAccounts(follower, following) {
  return bridgeApiCall("get_relationship_between_accounts", [
    follower,
    following
  ]);
}
async function getProfiles(accounts, observer) {
  return bridgeApiCall("get_profiles", { accounts, observer });
}

// src/modules/posts/queries/get-discussions-query-options.ts
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
      if (!entry) {
        return [];
      }
      const response = await CONFIG.hiveClient.call("bridge", "get_discussion", {
        author: entry.author,
        permlink: entry.permlink,
        observer: observer || entry.author
      });
      const results = response ? Array.from(Object.values(response)) : [];
      return filterDmcaEntry(results);
    },
    enabled: enabled && !!entry,
    select: (data) => sortDiscussions(entry, data, order)
  });
}
function getDiscussionQueryOptions(author, permlink, observer, enabled = true) {
  return queryOptions({
    queryKey: ["posts", "discussion", author, permlink, observer || author],
    enabled: enabled && !!author && !!permlink,
    queryFn: async () => getDiscussion(author, permlink, observer)
  });
}
function getAccountPostsInfiniteQueryOptions(username, filter = "posts", limit = 20, observer = "", enabled = true) {
  return infiniteQueryOptions({
    queryKey: ["posts", "account-posts", username ?? "", filter, limit, observer],
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
        ...observer && observer.length > 0 ? { observer } : {},
        ...pageParam.author ? { start_author: pageParam.author } : {},
        ...pageParam.permlink ? { start_permlink: pageParam.permlink } : {}
      };
      try {
        if (CONFIG.dmcaAccounts.includes(username)) return [];
        const resp = await CONFIG.hiveClient.call(
          "bridge",
          "get_account_posts",
          rpcParams
        );
        if (resp && Array.isArray(resp)) {
          return filterDmcaEntry(resp);
        }
        return [];
      } catch (err) {
        console.error("[SDK] get_account_posts error:", err);
        return [];
      }
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage?.[lastPage.length - 1];
      const hasNextPage = (lastPage?.length ?? 0) === limit;
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
function getAccountPostsQueryOptions(username, filter = "posts", start_author = "", start_permlink = "", limit = 20, observer = "", enabled = true) {
  return queryOptions({
    queryKey: [
      "posts",
      "account-posts-page",
      username ?? "",
      filter,
      start_author,
      start_permlink,
      limit,
      observer
    ],
    enabled: !!username && enabled,
    queryFn: async () => {
      if (!username) {
        return [];
      }
      const response = await getAccountPosts(
        filter,
        username,
        start_author,
        start_permlink,
        limit,
        observer
      );
      return filterDmcaEntry(response ?? []);
    }
  });
}
function getPostsRankedInfiniteQueryOptions(sort, tag, limit = 20, observer = "", enabled = true, _options = {}) {
  return infiniteQueryOptions({
    queryKey: ["posts", "posts-ranked", sort, tag, limit, observer],
    queryFn: async ({ pageParam }) => {
      if (!pageParam.hasNextPage) {
        return [];
      }
      let sanitizedTag = tag;
      if (CONFIG.dmcaTagRegexes.some((regex) => regex.test(tag))) {
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
        const combined = [pinnedEntry, ...nonPinnedEntries].filter((s) => !!s);
        return filterDmcaEntry(combined);
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
function getPostsRankedQueryOptions(sort, start_author = "", start_permlink = "", limit = 20, tag = "", observer = "", enabled = true) {
  return queryOptions({
    queryKey: [
      "posts",
      "posts-ranked-page",
      sort,
      start_author,
      start_permlink,
      limit,
      tag,
      observer
    ],
    enabled,
    queryFn: async () => {
      let sanitizedTag = tag;
      if (CONFIG.dmcaTagRegexes.some((regex) => regex.test(tag))) {
        sanitizedTag = "";
      }
      const response = await getPostsRanked(
        sort,
        start_author,
        start_permlink,
        limit,
        sanitizedTag,
        observer
      );
      return filterDmcaEntry(response ?? []);
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
function getSchedulesQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["posts", "schedules", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!activeUsername && !!code
  });
}
function getDraftsQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["posts", "drafts", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!activeUsername && !!code
  });
}
async function fetchUserImages(code) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch images: ${response.status}`);
  }
  return response.json();
}
function getImagesQueryOptions(username, code) {
  return queryOptions({
    queryKey: ["posts", "images", username],
    queryFn: async () => {
      if (!username || !code) {
        return [];
      }
      return fetchUserImages(code);
    },
    enabled: !!username && !!code
  });
}
function getGalleryImagesQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["posts", "gallery-images", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }
      return fetchUserImages(code);
    },
    enabled: !!activeUsername && !!code
  });
}
function getCommentHistoryQueryOptions(author, permlink, onlyMeta = false) {
  return queryOptions({
    queryKey: ["posts", "comment-history", author, permlink, onlyMeta],
    queryFn: async ({ signal }) => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/comment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          author,
          permlink,
          onlyMeta: onlyMeta ? "1" : ""
        }),
        signal
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch comment history: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!author && !!permlink
  });
}
function makeEntryPath2(author, permlink) {
  const cleanAuthor = author?.trim();
  const cleanPermlink = permlink?.trim();
  if (!cleanAuthor || !cleanPermlink) {
    throw new Error("Invalid entry path: author and permlink are required");
  }
  const normalizedAuthor = cleanAuthor.replace(/^@+/, "");
  const normalizedPermlink = cleanPermlink.replace(/^\/+/, "");
  if (!normalizedAuthor || !normalizedPermlink) {
    throw new Error("Invalid entry path: author and permlink cannot be empty after normalization");
  }
  return `@${normalizedAuthor}/${normalizedPermlink}`;
}
function getDeletedEntryQueryOptions(author, permlink) {
  const cleanPermlink = permlink?.trim();
  const cleanAuthor = author?.trim();
  const isValid = !!cleanAuthor && !!cleanPermlink && cleanPermlink !== "undefined";
  const entryPath = isValid ? makeEntryPath2(cleanAuthor, cleanPermlink) : "";
  return queryOptions({
    queryKey: ["posts", "deleted-entry", entryPath],
    queryFn: async ({ signal }) => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/comment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          author,
          permlink: cleanPermlink || ""
        }),
        signal
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch comment history: ${response.status}`);
      }
      return response.json();
    },
    select: (history) => {
      if (!history?.list?.[0]) {
        return null;
      }
      const { body, title, tags } = history.list[0];
      return {
        body,
        title,
        tags
      };
    },
    enabled: isValid
  });
}
function getPostTipsQueryOptions(author, permlink, isEnabled = true) {
  return queryOptions({
    queryKey: ["posts", "tips", author, permlink],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/post-tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          author,
          permlink
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch post tips: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!author && !!permlink && isEnabled
  });
}

// src/modules/posts/utils/waves-helpers.ts
function normalizeContainer(entry, host) {
  return {
    ...entry,
    id: entry.id ?? entry.post_id,
    host
  };
}
function normalizeParent(entry) {
  return {
    ...entry,
    id: entry.id ?? entry.post_id
  };
}
function normalizeWaveEntryFromApi(entry, host) {
  if (!entry) {
    return null;
  }
  const containerSource = entry.container ?? entry;
  const container = normalizeContainer(containerSource, host);
  const parent = entry.parent ? normalizeParent(entry.parent) : void 0;
  return {
    ...entry,
    id: entry.id ?? entry.post_id,
    host,
    container,
    parent
  };
}
function toEntryArray(x) {
  return Array.isArray(x) ? x : [];
}
async function getVisibleFirstLevelThreadItems(container) {
  const queryOptions86 = getDiscussionsQueryOptions(container, "created" /* created */, true);
  const discussionItemsRaw = await CONFIG.queryClient.fetchQuery(queryOptions86);
  const discussionItems = toEntryArray(discussionItemsRaw);
  if (discussionItems.length <= 1) {
    return [];
  }
  const firstLevelItems = discussionItems.filter(
    ({ parent_author, parent_permlink }) => parent_author === container.author && parent_permlink === container.permlink
  );
  if (firstLevelItems.length === 0) {
    return [];
  }
  const visibleItems = firstLevelItems.filter((item) => !item.stats?.gray);
  return visibleItems;
}
function mapThreadItemsToWaveEntries(items, container, host) {
  if (items.length === 0) {
    return [];
  }
  return items.map((item) => {
    const parent = items.find(
      (i) => i.author === item.parent_author && i.permlink === item.parent_permlink && i.author !== host
    );
    return {
      ...item,
      id: item.post_id,
      host,
      container,
      parent
    };
  }).filter((entry) => entry.container.post_id !== entry.post_id).sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );
}

// src/modules/posts/queries/get-waves-by-host-query-options.ts
var THREAD_CONTAINER_BATCH_SIZE = 5;
var MAX_CONTAINERS_TO_SCAN = 50;
async function getThreads(host, pageParam) {
  let startAuthor = pageParam?.author;
  let startPermlink = pageParam?.permlink;
  let scannedContainers = 0;
  let skipContainerId = pageParam?.post_id;
  while (scannedContainers < MAX_CONTAINERS_TO_SCAN) {
    const rpcParams = {
      sort: "posts",
      // ProfileFilter.posts
      account: host,
      limit: THREAD_CONTAINER_BATCH_SIZE,
      ...startAuthor ? { start_author: startAuthor } : {},
      ...startPermlink ? { start_permlink: startPermlink } : {}
    };
    const containers = await CONFIG.hiveClient.call(
      "bridge",
      "get_account_posts",
      rpcParams
    );
    if (!containers || containers.length === 0) {
      return null;
    }
    const normalizedContainers = containers.map((container) => {
      container.id = container.post_id;
      container.host = host;
      return container;
    });
    for (const container of normalizedContainers) {
      if (skipContainerId && container.post_id === skipContainerId) {
        skipContainerId = void 0;
        continue;
      }
      scannedContainers += 1;
      if (container.stats?.gray) {
        startAuthor = container.author;
        startPermlink = container.permlink;
        continue;
      }
      const visibleItems = await getVisibleFirstLevelThreadItems(container);
      if (visibleItems.length === 0) {
        startAuthor = container.author;
        startPermlink = container.permlink;
        continue;
      }
      return {
        entries: mapThreadItemsToWaveEntries(visibleItems, container, host)
      };
    }
    const lastContainer = normalizedContainers[normalizedContainers.length - 1];
    if (!lastContainer) {
      return null;
    }
    startAuthor = lastContainer.author;
    startPermlink = lastContainer.permlink;
  }
  return null;
}
function getWavesByHostQueryOptions(host) {
  return infiniteQueryOptions({
    queryKey: ["posts", "waves", "by-host", host],
    initialPageParam: void 0,
    queryFn: async ({ pageParam }) => {
      const result = await getThreads(host, pageParam);
      if (!result) return [];
      return result.entries;
    },
    getNextPageParam: (lastPage) => lastPage?.[0]?.container
  });
}
var DEFAULT_TAG_FEED_LIMIT = 40;
function getWavesByTagQueryOptions(host, tag, limit = DEFAULT_TAG_FEED_LIMIT) {
  return infiniteQueryOptions({
    queryKey: ["posts", "waves", "by-tag", host, tag],
    initialPageParam: void 0,
    queryFn: async ({ signal }) => {
      try {
        const url = new URL(CONFIG.privateApiHost + "/private-api/waves/tags");
        url.searchParams.set("container", host);
        url.searchParams.set("tag", tag);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          signal
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch waves by tag: ${response.status}`);
        }
        const data = await response.json();
        const result = data.slice(0, limit).map((entry) => normalizeWaveEntryFromApi(entry, host)).filter((entry) => Boolean(entry));
        return result.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("[SDK] Failed to fetch waves by tag", error);
        return [];
      }
    },
    getNextPageParam: () => void 0
  });
}
function getWavesFollowingQueryOptions(host, username) {
  const normalizedUsername = username?.trim().toLowerCase();
  return infiniteQueryOptions({
    queryKey: ["posts", "waves", "following", host, normalizedUsername ?? ""],
    enabled: Boolean(normalizedUsername),
    initialPageParam: void 0,
    queryFn: async ({ signal }) => {
      if (!normalizedUsername) {
        return [];
      }
      try {
        const url = new URL(CONFIG.privateApiHost + "/private-api/waves/following");
        url.searchParams.set("container", host);
        url.searchParams.set("username", normalizedUsername);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          signal
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch waves following feed: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          return [];
        }
        const flattened = data.map((entry) => normalizeWaveEntryFromApi(entry, host)).filter((entry) => Boolean(entry));
        if (flattened.length === 0) {
          return [];
        }
        return flattened.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("[SDK] Failed to fetch waves following feed", error);
        return [];
      }
    },
    getNextPageParam: () => void 0
  });
}
function getWavesTrendingTagsQueryOptions(host, hours = 24) {
  return queryOptions({
    queryKey: ["posts", "waves", "trending-tags", host, hours],
    queryFn: async ({ signal }) => {
      try {
        const url = new URL(CONFIG.privateApiHost + "/private-api/waves/trending/tags");
        url.searchParams.set("container", host);
        url.searchParams.set("hours", hours.toString());
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          signal
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch waves trending tags: ${response.status}`);
        }
        const data = await response.json();
        return data.map(({ tag, posts }) => ({ tag, posts }));
      } catch (error) {
        console.error("[SDK] Failed to fetch waves trending tags", error);
        return [];
      }
    }
  });
}
function getNormalizePostQueryOptions(post, enabled = true) {
  return queryOptions({
    queryKey: [
      "posts",
      "normalize",
      post?.author ?? "",
      post?.permlink ?? ""
    ],
    enabled: enabled && !!post,
    queryFn: async () => normalizePost(post)
  });
}

// src/modules/accounts/queries/get-account-vote-history-infinite-query-options.ts
function isEntry(x) {
  return !!x && typeof x === "object" && "author" in x && "permlink" in x && "active_votes" in x;
}
function getDays(createdDate) {
  const past = new Date(createdDate);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - past.getTime();
  return diffMs / (1e3 * 60 * 60 * 24);
}
function getAccountVoteHistoryInfiniteQueryOptions(username, options) {
  const { limit = 20, filters = [], dayLimit = 7 } = options ?? {};
  return infiniteQueryOptions({
    queryKey: ["accounts", "vote-history", username, limit],
    initialPageParam: { start: -1 },
    queryFn: async ({ pageParam }) => {
      const { start } = pageParam;
      const response = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_history",
        [username, start, limit, ...filters]
      );
      const mappedResults = response.map(([num, historyObj]) => ({
        ...historyObj.op[1],
        num,
        timestamp: historyObj.timestamp
      }));
      const result = mappedResults.filter(
        (filtered) => filtered.voter === username && filtered.weight !== 0 && getDays(filtered.timestamp) <= dayLimit
      );
      const entries = [];
      for (const obj of result) {
        const post = await CONFIG.queryClient.fetchQuery(
          getPostQueryOptions(obj.author, obj.permlink)
        );
        if (isEntry(post)) entries.push(post);
      }
      const [firstHistory] = response;
      return {
        lastDate: firstHistory ? getDays(firstHistory[1].timestamp) : 0,
        lastItemFetched: firstHistory ? firstHistory[0] : start,
        entries
      };
    },
    getNextPageParam: (lastPage) => ({
      start: lastPage.lastItemFetched
    })
  });
}
function getProfilesQueryOptions(accounts, observer, enabled = true) {
  return queryOptions({
    queryKey: ["accounts", "profiles", accounts, observer ?? ""],
    enabled: enabled && accounts.length > 0,
    queryFn: async () => getProfiles(accounts, observer)
  });
}

// src/modules/accounts/mutations/use-account-update.ts
function useAccountUpdate(username, auth) {
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
    (_data, variables) => queryClient.setQueryData(
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
    ),
    auth
  );
}
function useAccountRelationsUpdate(reference, target, auth, onSuccess, onError) {
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
      await broadcastJson(
        reference,
        "follow",
        [
          "follow",
          {
            follower: reference,
            following: target,
            what: [
              ...kind === "toggle-ignore" && !actualRelation?.ignores ? ["ignore"] : [],
              ...kind === "toggle-follow" && !actualRelation?.follows ? ["blog"] : []
            ]
          }
        ],
        auth
      );
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
function useBookmarkAdd(username, code, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "add", username],
    mutationFn: async ({ author, permlink }) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 missing auth");
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
            code
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
function useBookmarkDelete(username, code, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "delete", username],
    mutationFn: async (bookmarkId) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 missing auth");
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
            code
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
function useAccountFavouriteAdd(username, code, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 missing auth");
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
            code
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
function useAccountFavouriteDelete(username, code, onSuccess, onError) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] \u2013 missing auth");
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
            code
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
function useAccountRevokePosting(username, options, auth) {
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
        if (!auth?.broadcast) {
          throw new Error("[SDK][Accounts] \u2013 missing keychain broadcaster");
        }
        return auth.broadcast([["account_update", operationBody]], "active");
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
function useAccountUpdateRecovery(username, code, options, auth) {
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
        if (!code) {
          throw new Error("[SDK][Accounts] \u2013 missing access token");
        }
        const fetchApi = getBoundFetch();
        return fetchApi(CONFIG.privateApiHost + "/private-api/recoveries-add", {
          method: "POST",
          body: JSON.stringify({
            code,
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
        if (!auth?.broadcast) {
          throw new Error("[SDK][Accounts] \u2013 missing keychain broadcaster");
        }
        return auth.broadcast([["change_recovery_account", operationBody]], "owner");
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

// src/modules/accounts/utils/account-power.ts
var HIVE_VOTING_MANA_REGENERATION_SECONDS = 5 * 60 * 60 * 24;
function vestsToRshares(vests, votingPowerValue, votePerc) {
  const vestingShares = vests * 1e6;
  const power = votingPowerValue * votePerc / 1e4 / 50 + 1;
  return power * vestingShares / 1e4;
}
function toDhiveAccountForVotingMana(account) {
  return {
    id: 0,
    name: account.name,
    owner: account.owner,
    active: account.active,
    posting: account.posting,
    memo_key: account.memo_key,
    json_metadata: account.json_metadata,
    posting_json_metadata: account.posting_json_metadata,
    proxy: account.proxy ?? "",
    last_owner_update: "",
    last_account_update: "",
    created: account.created,
    mined: false,
    owner_challenged: false,
    active_challenged: false,
    last_owner_proved: "",
    last_active_proved: "",
    recovery_account: account.recovery_account ?? "",
    reset_account: "",
    last_account_recovery: "",
    comment_count: 0,
    lifetime_vote_count: 0,
    post_count: account.post_count,
    can_vote: true,
    voting_power: account.voting_power,
    last_vote_time: account.last_vote_time,
    voting_manabar: account.voting_manabar,
    balance: account.balance,
    savings_balance: account.savings_balance,
    hbd_balance: account.hbd_balance,
    hbd_seconds: "0",
    hbd_seconds_last_update: "",
    hbd_last_interest_payment: "",
    savings_hbd_balance: account.savings_hbd_balance,
    savings_hbd_seconds: account.savings_hbd_seconds,
    savings_hbd_seconds_last_update: account.savings_hbd_seconds_last_update,
    savings_hbd_last_interest_payment: account.savings_hbd_last_interest_payment,
    savings_withdraw_requests: 0,
    reward_hbd_balance: account.reward_hbd_balance,
    reward_hive_balance: account.reward_hive_balance,
    reward_vesting_balance: account.reward_vesting_balance,
    reward_vesting_hive: account.reward_vesting_hive,
    curation_rewards: 0,
    posting_rewards: 0,
    vesting_shares: account.vesting_shares,
    delegated_vesting_shares: account.delegated_vesting_shares,
    received_vesting_shares: account.received_vesting_shares,
    vesting_withdraw_rate: account.vesting_withdraw_rate,
    next_vesting_withdrawal: account.next_vesting_withdrawal,
    withdrawn: account.withdrawn,
    to_withdraw: account.to_withdraw,
    withdraw_routes: 0,
    proxied_vsf_votes: account.proxied_vsf_votes ?? [],
    witnesses_voted_for: 0,
    average_bandwidth: 0,
    lifetime_bandwidth: 0,
    last_bandwidth_update: "",
    average_market_bandwidth: 0,
    lifetime_market_bandwidth: 0,
    last_market_bandwidth_update: "",
    last_post: account.last_post,
    last_root_post: ""
  };
}
function votingPower(account) {
  const calc = CONFIG.hiveClient.rc.calculateVPMana(
    toDhiveAccountForVotingMana(account)
  );
  return calc.percentage / 100;
}
function powerRechargeTime(power) {
  if (!Number.isFinite(power)) {
    throw new TypeError("Voting power must be a finite number");
  }
  if (power < 0 || power > 100) {
    throw new RangeError("Voting power must be between 0 and 100");
  }
  const missingPower = 100 - power;
  return missingPower * 100 * HIVE_VOTING_MANA_REGENERATION_SECONDS / 1e4;
}
function downVotingPower(account) {
  const totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares);
  const elapsed = Math.floor(Date.now() / 1e3) - account.downvote_manabar.last_update_time;
  const maxMana = totalShares * 1e6 / 4;
  if (maxMana <= 0) {
    return 0;
  }
  let currentMana = parseFloat(account.downvote_manabar.current_mana.toString()) + elapsed * maxMana / HIVE_VOTING_MANA_REGENERATION_SECONDS;
  if (currentMana > maxMana) {
    currentMana = maxMana;
  }
  const currentManaPerc = currentMana * 100 / maxMana;
  if (isNaN(currentManaPerc)) {
    return 0;
  }
  if (currentManaPerc > 100) {
    return 100;
  }
  return currentManaPerc;
}
function rcPower(account) {
  const calc = CONFIG.hiveClient.rc.calculateRCMana(account);
  return calc.percentage / 100;
}
function votingValue(account, dynamicProps, votingPowerValue, weight = 1e4) {
  if (!Number.isFinite(votingPowerValue) || !Number.isFinite(weight)) {
    return 0;
  }
  const { fundRecentClaims, fundRewardBalance, base, quote } = dynamicProps;
  if (!Number.isFinite(fundRecentClaims) || !Number.isFinite(fundRewardBalance) || !Number.isFinite(base) || !Number.isFinite(quote)) {
    return 0;
  }
  if (fundRecentClaims === 0 || quote === 0) {
    return 0;
  }
  let totalVests = 0;
  try {
    const vesting = parseAsset(account.vesting_shares).amount;
    const received = parseAsset(account.received_vesting_shares).amount;
    const delegated = parseAsset(account.delegated_vesting_shares).amount;
    if (![vesting, received, delegated].every(Number.isFinite)) {
      return 0;
    }
    totalVests = vesting + received - delegated;
  } catch {
    return 0;
  }
  if (!Number.isFinite(totalVests)) {
    return 0;
  }
  const rShares = vestsToRshares(totalVests, votingPowerValue, weight);
  if (!Number.isFinite(rShares)) {
    return 0;
  }
  return rShares / fundRecentClaims * fundRewardBalance * (base / quote);
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
function useSignOperationByKeychain(username, auth, keyType = "active") {
  return useMutation({
    mutationKey: ["operations", "sign-keychain", username],
    mutationFn: ({ operation }) => {
      if (!username) {
        throw new Error(
          "[SDK][Keychain] \u2013\xA0cannot sign operation with anon user"
        );
      }
      if (!auth?.broadcast) {
        throw new Error("[SDK][Keychain] \u2013 missing keychain broadcaster");
      }
      return auth.broadcast([operation], keyType);
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
function useAddFragment(username, code) {
  return useMutation({
    mutationKey: ["posts", "add-fragment", username],
    mutationFn: async ({ title, body }) => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-add",
        {
          method: "POST",
          body: JSON.stringify({
            code,
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
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [response, ...data ?? []]
      );
    }
  });
}
function useEditFragment(username, fragmentId, code) {
  return useMutation({
    mutationKey: ["posts", "edit-fragment", username, fragmentId],
    mutationFn: async ({ title, body }) => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-update",
        {
          method: "POST",
          body: JSON.stringify({
            code,
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
        getFragmentsQueryOptions(username, code).queryKey,
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
function useRemoveFragment(username, fragmentId, code) {
  return useMutation({
    mutationKey: ["posts", "remove-fragment", username],
    mutationFn: async () => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();
      return fetchApi(CONFIG.privateApiHost + "/private-api/fragments-delete", {
        method: "POST",
        body: JSON.stringify({
          code,
          id: fragmentId
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
    },
    onSuccess() {
      getQueryClient().setQueryData(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [...data ?? []].filter(({ id }) => id !== fragmentId)
      );
    }
  });
}

// src/modules/posts/utils/validate-post-creating.ts
var DEFAULT_VALIDATE_POST_DELAYS = [3e3, 3e3, 3e3];
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getContent(author, permlink) {
  return CONFIG.hiveClient.call("condenser_api", "get_content", [
    author,
    permlink
  ]);
}
async function validatePostCreating(author, permlink, attempts = 0, options) {
  const delays = options?.delays ?? DEFAULT_VALIDATE_POST_DELAYS;
  let response;
  try {
    response = await getContent(author, permlink);
  } catch (e) {
    response = void 0;
  }
  if (response || attempts >= delays.length) {
    return;
  }
  const waitMs = delays[attempts];
  if (waitMs > 0) {
    await delay(waitMs);
  }
  return validatePostCreating(author, permlink, attempts + 1, options);
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
function getDiscoverLeaderboardQueryOptions(duration) {
  return queryOptions({
    queryKey: ["analytics", "discover-leaderboard", duration],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/leaderboard/${duration}`,
        { signal }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }
      return response.json();
    }
  });
}
function getDiscoverCurationQueryOptions(duration) {
  return queryOptions({
    queryKey: ["analytics", "discover-curation", duration],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/curation/${duration}`,
        { signal }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch curation data: ${response.status}`);
      }
      const data = await response.json();
      const accounts = data.map((item) => item.account);
      const accountsResponse = await CONFIG.hiveClient.database.getAccounts(accounts);
      for (let index = 0; index < accountsResponse.length; index++) {
        const element = accountsResponse[index];
        const curator = data[index];
        const vestingShares = typeof element.vesting_shares === "string" ? element.vesting_shares : element.vesting_shares.toString();
        const receivedVestingShares = typeof element.received_vesting_shares === "string" ? element.received_vesting_shares : element.received_vesting_shares.toString();
        const delegatedVestingShares = typeof element.delegated_vesting_shares === "string" ? element.delegated_vesting_shares : element.delegated_vesting_shares.toString();
        const vestingWithdrawRate = typeof element.vesting_withdraw_rate === "string" ? element.vesting_withdraw_rate : element.vesting_withdraw_rate.toString();
        const effectiveVest = parseFloat(vestingShares) + parseFloat(receivedVestingShares) - parseFloat(delegatedVestingShares) - parseFloat(vestingWithdrawRate);
        curator.efficiency = curator.vests / effectiveVest;
      }
      data.sort((a, b) => b.efficiency - a.efficiency);
      return data;
    }
  });
}
function getPageStatsQueryOptions(url, dimensions = [], metrics = ["visitors", "pageviews", "visit_duration"], dateRange) {
  return queryOptions({
    queryKey: ["analytics", "page-stats", url, dimensions, metrics, dateRange],
    queryFn: async ({ signal }) => {
      const response = await fetch(CONFIG.privateApiHost + "/api/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          metrics,
          url: encodeURIComponent(url),
          dimensions,
          date_range: dateRange
        }),
        signal
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch page stats: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!url
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
function getDecodeMemoQueryOptions(username, memo, accessToken) {
  return queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
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
function getAccountTokenQueryOptions(username, accessToken) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "authenticate", username],
    enabled: !!username && !!accessToken,
    queryFn: async () => {
      if (!username || !accessToken) {
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
        (await response.json()).memo,
        accessToken
      );
      await getQueryClient().prefetchQuery(memoQueryOptions);
      const { memoDecoded } = getQueryClient().getQueryData(
        memoQueryOptions.queryKey
      );
      return memoDecoded.replace("#", "");
    }
  });
}
function getAccountVideosQueryOptions(username, accessToken) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "videos", username],
    enabled: !!username && !!accessToken,
    queryFn: async () => {
      if (!username || !accessToken) {
        throw new Error("[SDK][Integrations][3Speak] \u2013\xA0anon user");
      }
      const tokenQueryOptions = getAccountTokenQueryOptions(
        username,
        accessToken
      );
      await getQueryClient().prefetchQuery(tokenQueryOptions);
      const token = getQueryClient().getQueryData(tokenQueryOptions.queryKey);
      if (!token) {
        throw new Error("[SDK][Integrations][3Speak] \u2013 missing account token");
      }
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
    retry: false,
    // Don't retry on user not found errors
    queryFn: async () => {
      try {
        const fetchApi = getBoundFetch();
        const response = await fetchApi(
          `https://hiveposh.com/api/v0/linked-accounts/${username}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData?.message === "User Not Connected") {
            return null;
          }
        }
        if (!response.ok) {
          return null;
        }
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
      } catch (err) {
        return null;
      }
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
      const response = await fetchApi(`${CONFIG.privateApiHost}/api/stats`, {
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
function getGameStatusCheckQueryOptions(username, code, gameType) {
  return queryOptions({
    queryKey: ["games", "status-check", gameType, username],
    enabled: !!username && !!code,
    queryFn: async () => {
      if (!username || !code) {
        throw new Error("[SDK][Games] \u2013 missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/get-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code
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
function useGameClaim(username, code, gameType, key) {
  const { mutateAsync: recordActivity } = useRecordActivity(
    username,
    "spin-rolled"
  );
  return useMutation({
    mutationKey: ["games", "post", gameType, username],
    mutationFn: async () => {
      if (!username || !code) {
        throw new Error("[SDK][Games] \u2013 missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/post-game",
        {
          method: "POST",
          body: JSON.stringify({
            game_type: gameType,
            code,
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
function getCommunityQueryOptions(name, observer = "", enabled = true) {
  return queryOptions({
    queryKey: ["community", "single", name, observer],
    enabled: enabled && !!name,
    queryFn: async () => getCommunity(name ?? "", observer)
  });
}
function getCommunitySubscribersQueryOptions(communityName) {
  return queryOptions({
    queryKey: ["communities", "subscribers", communityName],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call("bridge", "list_subscribers", {
        community: communityName
      });
      return response ?? [];
    },
    staleTime: 6e4
  });
}
function getAccountNotificationsInfiniteQueryOptions(account, limit) {
  return infiniteQueryOptions({
    queryKey: ["communities", "account-notifications", account, limit],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      try {
        const response = await CONFIG.hiveClient.call("bridge", "account_notifications", {
          account,
          limit,
          last_id: pageParam ?? void 0
        });
        return response ?? [];
      } catch {
        return [];
      }
    },
    getNextPageParam: (lastPage) => lastPage?.length > 0 ? lastPage[lastPage.length - 1].id : null
  });
}
function getRewardedCommunitiesQueryOptions() {
  return queryOptions({
    queryKey: ["communities", "rewarded"],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/rewarded-communities",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch rewarded communities: ${response.status}`);
      }
      return response.json();
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
function getNotificationsUnreadCountQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["notifications", "unread", activeUsername],
    queryFn: async () => {
      if (!code) {
        return 0;
      }
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/notifications/unread`,
        {
          method: "POST",
          body: JSON.stringify({ code }),
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      const data = await response.json();
      return data.count;
    },
    enabled: !!activeUsername && !!code,
    initialData: 0,
    refetchInterval: 6e4
  });
}
function getNotificationsInfiniteQueryOptions(activeUsername, code, filter = void 0) {
  return infiniteQueryOptions({
    queryKey: ["notifications", activeUsername, filter],
    queryFn: async ({ pageParam }) => {
      if (!code) {
        return [];
      }
      const data = {
        code,
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
    enabled: !!activeUsername && !!code,
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
function getNotificationsSettingsQueryOptions(activeUsername, code) {
  return queryOptions({
    queryKey: ["notifications", "settings", activeUsername],
    queryFn: async () => {
      let token = activeUsername + "-web";
      if (!code) {
        throw new Error("Missing access token");
      }
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/detail-device",
        {
          body: JSON.stringify({
            code,
            username: activeUsername,
            token
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch notification settings: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!activeUsername && !!code,
    refetchOnMount: false,
    initialData: () => {
      const wasMutedPreviously = typeof window !== "undefined" ? localStorage.getItem("notifications") !== "true" : false;
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
function getAnnouncementsQueryOptions() {
  return queryOptions({
    queryKey: ["notifications", "announcements"],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/announcements", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    },
    staleTime: 36e5
  });
}
function getProposalQueryOptions(id) {
  return queryOptions({
    queryKey: ["proposals", "proposal", id],
    queryFn: async () => {
      const r = await CONFIG.hiveClient.call("condenser_api", "find_proposals", [[id]]);
      const proposal = r[0];
      if (new Date(proposal.start_date) < /* @__PURE__ */ new Date() && new Date(proposal.end_date) >= /* @__PURE__ */ new Date()) {
        proposal.status = "active";
      } else if (new Date(proposal.end_date) < /* @__PURE__ */ new Date()) {
        proposal.status = "expired";
      } else {
        proposal.status = "inactive";
      }
      return proposal;
    }
  });
}
function getProposalsQueryOptions() {
  return queryOptions({
    queryKey: ["proposals", "list"],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call("database_api", "list_proposals", {
        start: [-1],
        limit: 500,
        order: "by_total_votes",
        order_direction: "descending",
        status: "all"
      });
      const proposals = response.proposals;
      const expired = proposals.filter((x) => x.status === "expired");
      const others = proposals.filter((x) => x.status !== "expired");
      return [...others, ...expired];
    }
  });
}
function getProposalVotesInfiniteQueryOptions(proposalId, voter, limit) {
  return infiniteQueryOptions({
    queryKey: ["proposals", "votes", proposalId, voter, limit],
    initialPageParam: voter,
    refetchOnMount: true,
    staleTime: 0,
    // Always refetch on mount
    queryFn: async ({ pageParam }) => {
      const startParam = pageParam ?? voter;
      const response = await CONFIG.hiveClient.call("condenser_api", "list_proposal_votes", [
        [proposalId, startParam],
        limit,
        "by_proposal_voter"
      ]);
      const list = response.filter((x) => x.proposal?.proposal_id === proposalId).map((x) => ({ id: x.id, voter: x.voter }));
      const rawAccounts = await CONFIG.hiveClient.database.getAccounts(list.map((l) => l.voter));
      const accounts = parseAccounts(rawAccounts);
      const page = list.map((i) => ({
        ...i,
        voterAccount: accounts.find((a) => i.voter === a.name)
      }));
      return page;
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage?.[lastPage.length - 1];
      return last?.voter ?? void 0;
    }
  });
}
function getUserProposalVotesQueryOptions(voter) {
  return queryOptions({
    queryKey: ["proposals", "votes", "by-user", voter],
    enabled: !!voter && voter !== "",
    staleTime: 60 * 1e3,
    // Cache for 1 minute
    queryFn: async () => {
      if (!voter || voter === "") {
        return [];
      }
      const response = await CONFIG.hiveClient.call("database_api", "list_proposal_votes", {
        start: [voter],
        limit: 1e3,
        order: "by_voter_proposal",
        order_direction: "ascending",
        status: "votable"
      });
      const userVotes = (response.proposal_votes || []).filter((vote) => vote.voter === voter);
      return userVotes;
    }
  });
}
function getVestingDelegationsQueryOptions(username, from, limit = 50) {
  return queryOptions({
    queryKey: ["wallet", "vesting-delegations", username, from, limit],
    queryFn: () => CONFIG.hiveClient.database.call("get_vesting_delegations", [
      username,
      from,
      limit
    ]),
    enabled: !!username
  });
}
function getConversionRequestsQueryOptions(account) {
  return queryOptions({
    queryKey: ["wallet", "conversion-requests", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_conversion_requests", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.requestid - b.requestid)
  });
}
function getCollateralizedConversionRequestsQueryOptions(account) {
  return queryOptions({
    queryKey: ["wallet", "collateralized-conversion-requests", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_collateralized_conversion_requests", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.requestid - b.requestid)
  });
}
function getSavingsWithdrawFromQueryOptions(account) {
  return queryOptions({
    queryKey: ["wallet", "savings-withdraw", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_savings_withdraw_from", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.request_id - b.request_id)
  });
}
function getWithdrawRoutesQueryOptions(account) {
  return queryOptions({
    queryKey: ["wallet", "withdraw-routes", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_withdraw_routes", [
      account,
      "outgoing"
    ])
  });
}
function getOpenOrdersQueryOptions(user) {
  return queryOptions({
    queryKey: ["wallet", "open-orders", user],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_open_orders", [
      user
    ]),
    select: (data) => data.sort((a, b) => a.orderid - b.orderid),
    enabled: !!user
  });
}
function getOutgoingRcDelegationsInfiniteQueryOptions(username, limit = 100) {
  return infiniteQueryOptions({
    queryKey: ["wallet", "outgoing-rc-delegations", username, limit],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await CONFIG.hiveClient.call("rc_api", "list_rc_direct_delegations", {
        start: [username, pageParam ?? ""],
        limit
      }).then((r) => r);
      let delegations = response.rc_direct_delegations || [];
      if (pageParam) {
        delegations = delegations.filter((delegation) => delegation.to !== pageParam);
      }
      return delegations;
    },
    getNextPageParam: (lastPage) => lastPage.length === limit ? lastPage[lastPage.length - 1].to : null
  });
}
function getIncomingRcQueryOptions(username) {
  return queryOptions({
    queryKey: ["wallet", "incoming-rc", username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallet] - Missing username for incoming RC");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/received-rc/${username}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch incoming RC: ${response.status}`);
      }
      return response.json();
    }
  });
}
function getReceivedVestingSharesQueryOptions(username) {
  return queryOptions({
    queryKey: ["wallet", "received-vesting-shares", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/received-vesting/${username}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch received vesting shares: ${response.status}`);
      }
      const data = await response.json();
      return data.list;
    }
  });
}
function getWitnessesInfiniteQueryOptions(limit) {
  return infiniteQueryOptions({
    queryKey: ["witnesses", "list", limit],
    initialPageParam: "",
    queryFn: async ({ pageParam }) => CONFIG.hiveClient.call("condenser_api", "get_witnesses_by_vote", [
      pageParam,
      limit
    ]),
    getNextPageParam: (lastPage) => {
      const last = lastPage?.[lastPage.length - 1];
      return last ? last.owner : void 0;
    }
  });
}
function getOrderBookQueryOptions(limit = 500) {
  return queryOptions({
    queryKey: ["market", "order-book", limit],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_order_book", [
      limit
    ])
  });
}
function getMarketStatisticsQueryOptions() {
  return queryOptions({
    queryKey: ["market", "statistics"],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_ticker", [])
  });
}
function getMarketHistoryQueryOptions(seconds, startDate, endDate) {
  const formatDate2 = (date) => {
    return date.toISOString().replace(/\.\d{3}Z$/, "");
  };
  return queryOptions({
    queryKey: ["market", "history", seconds, startDate.getTime(), endDate.getTime()],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_market_history", [
      seconds,
      formatDate2(startDate),
      formatDate2(endDate)
    ])
  });
}
function getHiveHbdStatsQueryOptions() {
  return queryOptions({
    queryKey: ["market", "hive-hbd-stats"],
    queryFn: async () => {
      const stats = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_ticker",
        []
      );
      const now = /* @__PURE__ */ new Date();
      const oneDayAgo = new Date(now.getTime() - 864e5);
      const formatDate2 = (date) => {
        return date.toISOString().replace(/\.\d{3}Z$/, "");
      };
      const dayChange = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [86400, formatDate2(oneDayAgo), formatDate2(now)]
      );
      const result = {
        price: +stats.latest,
        close: dayChange[0] ? dayChange[0].non_hive.open / dayChange[0].hive.open : 0,
        high: dayChange[0] ? dayChange[0].non_hive.high / dayChange[0].hive.high : 0,
        low: dayChange[0] ? dayChange[0].non_hive.low / dayChange[0].hive.low : 0,
        percent: dayChange[0] ? 100 - dayChange[0].non_hive.open / dayChange[0].hive.open * 100 / +stats.latest : 0,
        totalFromAsset: stats.hive_volume.split(" ")[0],
        totalToAsset: stats.hbd_volume.split(" ")[0]
      };
      return result;
    }
  });
}
function getMarketDataQueryOptions(coin, vsCurrency, fromTs, toTs) {
  return queryOptions({
    queryKey: ["market", "data", coin, vsCurrency, fromTs, toTs],
    queryFn: async ({ signal }) => {
      const fetchApi = getBoundFetch();
      const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;
      const response = await fetchApi(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status}`);
      }
      return response.json();
    }
  });
}
function formatDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}
function getTradeHistoryQueryOptions(limit = 1e3, startDate, endDate) {
  const end = endDate ?? /* @__PURE__ */ new Date();
  const start = startDate ?? new Date(end.getTime() - 10 * 60 * 60 * 1e3);
  return queryOptions({
    queryKey: ["market", "trade-history", limit, start.getTime(), end.getTime()],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_trade_history", [
      formatDate(start),
      formatDate(end),
      limit
    ])
  });
}

// src/modules/market/requests.ts
async function parseJsonResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
async function getMarketData(coin, vsCurrency, fromTs, toTs) {
  const fetchApi = getBoundFetch();
  const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;
  const response = await fetchApi(url);
  return parseJsonResponse(response);
}
async function getCurrencyRate(cur) {
  if (cur === "hbd") {
    return 1;
  }
  const fetchApi = getBoundFetch();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=${cur}`;
  const response = await fetchApi(url);
  const data = await parseJsonResponse(response);
  return data.hive_dollar[cur];
}
async function getCurrencyTokenRate(currency, token) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost + `/private-api/market-data/${currency === "hbd" ? "usd" : currency}/${token}`
  );
  return parseJsonResponse(response);
}
async function getCurrencyRates() {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/market-data/latest");
  return parseJsonResponse(response);
}
async function getHivePrice() {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd"
  );
  return parseJsonResponse(response);
}
function getPointsQueryOptions(username, filter = 0) {
  return queryOptions({
    queryKey: ["points", username, filter],
    queryFn: async () => {
      if (!username) {
        throw new Error("Get points query \u2013 username wasn't provided");
      }
      const name = username.replace("@", "");
      const pointsResponse = await fetch(CONFIG.privateApiHost + "/private-api/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: name })
      });
      if (!pointsResponse.ok) {
        throw new Error(`Failed to fetch points: ${pointsResponse.status}`);
      }
      const points = await pointsResponse.json();
      const transactionsResponse = await fetch(
        CONFIG.privateApiHost + "/private-api/point-list",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username: name, type: filter })
        }
      );
      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch point transactions: ${transactionsResponse.status}`);
      }
      const transactions = await transactionsResponse.json();
      return {
        points: points.points,
        uPoints: points.unclaimed_points,
        transactions
      };
    },
    staleTime: 3e4,
    refetchOnMount: true,
    enabled: !!username
  });
}
function searchQueryOptions(q, sort, hideLow, since, scroll_id, votes) {
  return queryOptions({
    queryKey: ["search", q, sort, hideLow, since, scroll_id, votes],
    queryFn: async () => {
      const data = { q, sort, hide_low: hideLow };
      if (since) data.since = since;
      if (scroll_id) data.scroll_id = scroll_id;
      if (votes) data.votes = votes;
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      return response.json();
    }
  });
}
function getControversialRisingInfiniteQueryOptions(what, tag, enabled = true) {
  return infiniteQueryOptions({
    queryKey: ["search", "controversial-rising", what, tag],
    initialPageParam: { sid: void 0, hasNextPage: true },
    queryFn: async ({ pageParam }) => {
      if (!pageParam.hasNextPage) {
        return {
          hits: 0,
          took: 0,
          results: []
        };
      }
      let sinceDate;
      const now = /* @__PURE__ */ new Date();
      switch (tag) {
        case "today":
          sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case "week":
          sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "month":
          sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        case "year":
          sinceDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1e3);
          break;
        default:
          sinceDate = void 0;
      }
      const q = "* type:post";
      const sort = what === "rising" ? "children" : what;
      const since = sinceDate ? sinceDate.toISOString().split(".")[0] : void 0;
      const hideLow = "0";
      const votes = tag === "today" ? 50 : 200;
      const data = { q, sort, hide_low: hideLow };
      if (since) data.since = since;
      if (pageParam.sid) data.scroll_id = pageParam.sid;
      data.votes = votes;
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      return response.json();
    },
    getNextPageParam: (resp) => {
      return {
        sid: resp?.scroll_id,
        hasNextPage: resp.results.length > 0
      };
    },
    enabled
  });
}
function buildQuery(entry, retry = 3) {
  const { json_metadata, permlink } = entry;
  let q = "*";
  q += ` -dporn type:post`;
  let tags;
  if (json_metadata && json_metadata.tags && Array.isArray(json_metadata.tags)) {
    tags = json_metadata.tags.filter((tag) => tag && tag !== "" && typeof tag === "string").filter((tag) => !tag.startsWith("hive-")).filter((_tag, ind) => ind < +retry).join(",");
  }
  if (tags && tags.length > 0) {
    q += ` tag:${tags}`;
  } else {
    const fperm = permlink.split("-");
    tags = fperm.filter((part) => part !== "").filter((part) => !/^-?\d+$/.test(part)).filter((part) => part.length > 2).join(",");
    q += ` tag:${tags}`;
  }
  return q;
}
function getSimilarEntriesQueryOptions(entry) {
  const query = buildQuery(entry);
  return queryOptions({
    queryKey: ["search", "similar-entries", entry.author, entry.permlink, query],
    queryFn: async () => {
      const data = {
        q: query,
        sort: "newest",
        hide_low: "0"
      };
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      const searchResponse = await response.json();
      const rawEntries = searchResponse.results.filter(
        (r) => r.permlink !== entry.permlink && r.tags.indexOf("nsfw") === -1
      );
      const entries = [];
      for (const result of rawEntries) {
        if (entries.find((y) => y.author === result.author) === void 0) {
          entries.push(result);
        }
      }
      return entries.slice(0, 3);
    }
  });
}
function getSearchAccountQueryOptions(q, limit = 5, random = false) {
  return queryOptions({
    queryKey: ["search", "account", q, limit],
    queryFn: async () => {
      const data = { q, limit, random: +random };
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Failed to search accounts: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!q
  });
}
function getSearchTopicsQueryOptions(q, limit = 20, random = false) {
  return queryOptions({
    queryKey: ["search", "topics", q],
    queryFn: async () => {
      const data = { q, limit, random: +random };
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Failed to search topics: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!q
  });
}
function getSearchApiInfiniteQueryOptions(q, sort, hideLow, since, votes) {
  return infiniteQueryOptions({
    queryKey: ["search", "api", q, sort, hideLow, since, votes],
    queryFn: async ({ pageParam }) => {
      const payload = { q, sort, hide_low: hideLow };
      if (since) {
        payload.since = since;
      }
      if (pageParam) {
        payload.scroll_id = pageParam;
      }
      if (votes !== void 0) {
        payload.votes = votes;
      }
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      return response.json();
    },
    initialPageParam: void 0,
    getNextPageParam: (lastPage) => lastPage?.scroll_id,
    enabled: !!q
  });
}
function getSearchPathQueryOptions(q) {
  return queryOptions({
    queryKey: ["search", "path", q],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q })
      });
      if (!response.ok) {
        throw new Error(`Search path failed: ${response.status}`);
      }
      const data = await response.json();
      if (data?.length > 0) {
        return data;
      }
      return [q];
    }
  });
}

// src/modules/search/requests.ts
async function parseJsonResponse2(response) {
  const parseBody = async () => {
    try {
      return await response.json();
    } catch {
      try {
        return await response.text();
      } catch {
        return void 0;
      }
    }
  };
  const data = await parseBody();
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  if (data === void 0) {
    throw new Error("Response body was empty or invalid JSON");
  }
  return data;
}
async function search(q, sort, hideLow, since, scroll_id, votes) {
  const data = { q, sort, hide_low: hideLow };
  if (since) {
    data.since = since;
  }
  if (scroll_id) {
    data.scroll_id = scroll_id;
  }
  if (votes) {
    data.votes = votes;
  }
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse2(response);
}
async function searchAccount(q = "", limit = 20, random = 1) {
  const data = { q, limit, random };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse2(response);
}
async function searchTag(q = "", limit = 20, random = 0) {
  const data = { q, limit, random };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-tag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse2(response);
}
async function searchPath(q) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q })
  });
  const data = await parseJsonResponse2(response);
  return data?.length > 0 ? data : [q];
}
function getBoostPlusPricesQueryOptions(accessToken) {
  return queryOptions({
    queryKey: ["promotions", "boost-plus-prices"],
    queryFn: async () => {
      if (!accessToken) {
        return [];
      }
      const response = await fetch(CONFIG.privateApiHost + "/private-api/boost-plus-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: accessToken })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch boost plus prices: ${response.status}`);
      }
      return await response.json();
    },
    staleTime: Infinity,
    refetchOnMount: true,
    enabled: !!accessToken
  });
}
function getPromotePriceQueryOptions(accessToken) {
  return queryOptions({
    queryKey: ["promotions", "promote-price"],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/promote-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: accessToken })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch promote prices: ${response.status}`);
      }
      return await response.json();
    },
    enabled: !!accessToken
  });
}
function getBoostPlusAccountPricesQueryOptions(account, accessToken) {
  return queryOptions({
    queryKey: ["promotions", "boost-plus-accounts", account],
    queryFn: async () => {
      if (!accessToken || !account) {
        return null;
      }
      const response = await fetch(CONFIG.privateApiHost + "/private-api/boosted-plus-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: accessToken, account })
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch boost plus account prices: ${response.status}`);
      }
      const responseData = await response.json();
      return responseData ? {
        account: responseData.account,
        expires: new Date(responseData.expires)
      } : null;
    },
    enabled: !!account && !!accessToken
  });
}

// src/modules/private-api/requests.ts
async function parseJsonResponse3(response) {
  if (!response.ok) {
    let errorData = void 0;
    try {
      errorData = await response.json();
    } catch {
      errorData = void 0;
    }
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return await response.json();
}
async function signUp(username, email, referral) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/account-create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, referral })
  });
  const data = await parseJsonResponse3(response);
  return { status: response.status, data };
}
async function subscribeEmail(email) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });
  const data = await parseJsonResponse3(response);
  return { status: response.status, data };
}
async function usrActivity(code, ty, bl = "", tx = "") {
  const params = { code, ty };
  if (bl) {
    params.bl = bl;
  }
  if (tx) {
    params.tx = tx;
  }
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/usr-activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });
  await parseJsonResponse3(response);
}
async function getNotifications(code, filter, since = null, user = null) {
  const data = {
    code
  };
  if (filter) {
    data.filter = filter;
  }
  if (since) {
    data.since = since;
  }
  if (user) {
    data.user = user;
  }
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function saveNotificationSetting(code, username, system, allows_notify, notify_types, token) {
  const data = {
    code,
    username,
    token,
    system,
    allows_notify,
    notify_types
  };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/register-device", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function getNotificationSetting(code, username, token) {
  const data = { code, username, token };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/detail-device", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function markNotifications(code, id) {
  const data = {
    code
  };
  if (id) {
    data.id = id;
  }
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/notifications/mark", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function addImage(code, url) {
  const data = { code, url };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function uploadImage(file, token, signal) {
  const fetchApi = getBoundFetch();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetchApi(`${CONFIG.imageHost}/hs/${token}`, {
    method: "POST",
    body: formData,
    signal
  });
  return parseJsonResponse3(response);
}
async function deleteImage(code, imageId) {
  const data = { code, id: imageId };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function addDraft(code, title, body, tags, meta) {
  const data = { code, title, body, tags, meta };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function updateDraft(code, draftId, title, body, tags, meta) {
  const data = { code, id: draftId, title, body, tags, meta };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function deleteDraft(code, draftId) {
  const data = { code, id: draftId };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function addSchedule(code, permlink, title, body, meta, options, schedule, reblog) {
  const data = {
    code,
    permlink,
    title,
    body,
    meta,
    schedule,
    reblog
  };
  if (options) {
    data.options = options;
  }
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function deleteSchedule(code, id) {
  const data = { code, id };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function moveSchedule(code, id) {
  const data = { code, id };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-move", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function getPromotedPost(code, author, permlink) {
  const data = { code, author, permlink };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/promoted-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseJsonResponse3(response);
}
async function onboardEmail(username, email, friend) {
  const dataBody = {
    username,
    email,
    friend
  };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost + "/private-api/account-create-friend",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dataBody)
    }
  );
  return parseJsonResponse3(response);
}

// src/modules/auth/requests.ts
async function hsTokenRenew(code) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/auth-api/hs-token-refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code })
  });
  if (!response.ok) {
    let data2 = void 0;
    try {
      data2 = await response.json();
    } catch {
      data2 = void 0;
    }
    const error = new Error(`Failed to refresh token: ${response.status}`);
    error.status = response.status;
    error.data = data2;
    throw error;
  }
  const data = await response.json();
  return data;
}

// src/modules/hive-engine/requests.ts
var ENGINE_RPC_HEADERS = { "Content-type": "application/json" };
async function engineRpc(payload) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(`${CONFIG.privateApiHost}/private-api/engine-api`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: ENGINE_RPC_HEADERS
  });
  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] \u2013 request failed with ${response.status}`
    );
  }
  const data = await response.json();
  return data.result;
}
async function engineRpcSafe(payload, fallback) {
  try {
    return await engineRpc(payload);
  } catch (e) {
    return fallback;
  }
}
async function getHiveEngineOrderBook(symbol, limit = 50) {
  const baseParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: { symbol },
      limit,
      offset: 0
    },
    id: 1
  };
  const [buy, sell] = await Promise.all([
    engineRpcSafe(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "buyBook",
          indexes: [{ index: "price", descending: true }]
        }
      },
      []
    ),
    engineRpcSafe(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "sellBook",
          indexes: [{ index: "price", descending: false }]
        }
      },
      []
    )
  ]);
  const sortByPriceDesc = (items) => items.sort((a, b) => {
    const left = Number(a.price ?? 0);
    const right = Number(b.price ?? 0);
    return right - left;
  });
  const sortByPriceAsc = (items) => items.sort((a, b) => {
    const left = Number(a.price ?? 0);
    const right = Number(b.price ?? 0);
    return left - right;
  });
  return {
    buy: sortByPriceDesc(buy),
    sell: sortByPriceAsc(sell)
  };
}
async function getHiveEngineTradeHistory(symbol, limit = 50) {
  return engineRpcSafe(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "market",
        table: "tradesHistory",
        query: { symbol },
        limit,
        offset: 0,
        indexes: [{ index: "timestamp", descending: true }]
      },
      id: 1
    },
    []
  );
}
async function getHiveEngineOpenOrders(account, symbol, limit = 100) {
  const baseParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: { symbol, account },
      limit,
      offset: 0
    },
    id: 1
  };
  const [buyRaw, sellRaw] = await Promise.all([
    engineRpcSafe(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "buyBook",
          indexes: [{ index: "timestamp", descending: true }]
        }
      },
      []
    ),
    engineRpcSafe(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "sellBook",
          indexes: [{ index: "timestamp", descending: true }]
        }
      },
      []
    )
  ]);
  const formatTotal = (quantity, price) => (Number(quantity || 0) * Number(price || 0)).toFixed(8);
  const buy = buyRaw.map((order) => ({
    id: order.txId,
    type: "buy",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: order.tokensLocked ?? formatTotal(order.quantity, order.price),
    timestamp: Number(order.timestamp ?? 0)
  }));
  const sell = sellRaw.map((order) => ({
    id: order.txId,
    type: "sell",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: formatTotal(order.quantity, order.price),
    timestamp: Number(order.timestamp ?? 0)
  }));
  return [...buy, ...sell].sort((a, b) => b.timestamp - a.timestamp);
}
async function getHiveEngineMetrics(symbol, account) {
  return engineRpcSafe(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "market",
        table: "metrics",
        query: {
          ...symbol ? { symbol } : {},
          ...account ? { account } : {}
        }
      },
      id: 1
    },
    []
  );
}
async function getHiveEngineTokensMarket(account, symbol) {
  return getHiveEngineMetrics(symbol, account);
}
async function getHiveEngineTokensBalances(username) {
  return engineRpcSafe(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "tokens",
        table: "balances",
        query: {
          account: username
        }
      },
      id: 1
    },
    []
  );
}
async function getHiveEngineTokensMetadata(tokens) {
  return engineRpcSafe(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "tokens",
        table: "tokens",
        query: {
          symbol: { $in: tokens }
        }
      },
      id: 2
    },
    []
  );
}
async function getHiveEngineTokenTransactions(username, symbol, limit, offset) {
  const fetchApi = getBoundFetch();
  const url = new URL(
    `${CONFIG.privateApiHost}/private-api/engine-account-history`
  );
  url.searchParams.set("account", username);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  const response = await fetchApi(url.toString(), {
    method: "GET",
    headers: { "Content-type": "application/json" }
  });
  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] \u2013 account history failed with ${response.status}`
    );
  }
  return await response.json();
}
async function getHiveEngineTokenMetrics(symbol, interval = "daily") {
  const fetchApi = getBoundFetch();
  const url = new URL(`${CONFIG.privateApiHost}/private-api/engine-chart-api`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  const response = await fetchApi(url.toString(), {
    headers: { "Content-type": "application/json" }
  });
  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] \u2013 chart failed with ${response.status}`
    );
  }
  return await response.json();
}
async function getHiveEngineUnclaimedRewards(username) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    `${CONFIG.privateApiHost}/private-api/engine-reward-api/${username}?hive=1`
  );
  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] \u2013 rewards failed with ${response.status}`
    );
  }
  return await response.json();
}

// src/modules/spk/requests.ts
async function getSpkWallet(username) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(`${CONFIG.spkNode}/@${username}`);
  if (!response.ok) {
    throw new Error(`[SDK][SPK] \u2013 wallet failed with ${response.status}`);
  }
  return await response.json();
}
async function getSpkMarkets() {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(`${CONFIG.spkNode}/markets`);
  if (!response.ok) {
    throw new Error(`[SDK][SPK] \u2013 markets failed with ${response.status}`);
  }
  return await response.json();
}

export { ACCOUNT_OPERATION_GROUPS, ALL_ACCOUNT_OPERATIONS, ALL_NOTIFY_TYPES, CONFIG, ConfigManager, mutations_exports as EcencyAnalytics, EcencyQueriesManager, HiveSignerIntegration, NaiMap, NotificationFilter, NotificationViewType, NotifyTypes, ROLES, SortOrder, Symbol2 as Symbol, ThreeSpeakIntegration, addDraft, addImage, addSchedule, bridgeApiCall, broadcastJson, buildProfileMetadata, checkUsernameWalletsPendingQueryOptions, decodeObj, dedupeAndSortKeyAuths, deleteDraft, deleteImage, deleteSchedule, downVotingPower, encodeObj, extractAccountProfile, getAccountFullQueryOptions, getAccountNotificationsInfiniteQueryOptions, getAccountPendingRecoveryQueryOptions, getAccountPosts, getAccountPostsInfiniteQueryOptions, getAccountPostsQueryOptions, getAccountRcQueryOptions, getAccountRecoveriesQueryOptions, getAccountReputationsQueryOptions, getAccountSubscriptionsQueryOptions, getAccountVoteHistoryInfiniteQueryOptions, getAccountsQueryOptions, getActiveAccountBookmarksQueryOptions, getActiveAccountFavouritesQueryOptions, getAnnouncementsQueryOptions, getBoostPlusAccountPricesQueryOptions, getBoostPlusPricesQueryOptions, getBotsQueryOptions, getBoundFetch, getChainPropertiesQueryOptions, getCollateralizedConversionRequestsQueryOptions, getCommentHistoryQueryOptions, getCommunities, getCommunitiesQueryOptions, getCommunity, getCommunityContextQueryOptions, getCommunityPermissions, getCommunityQueryOptions, getCommunitySubscribersQueryOptions, getCommunityType, getContentQueryOptions, getContentRepliesQueryOptions, getControversialRisingInfiniteQueryOptions, getConversionRequestsQueryOptions, getCurrencyRate, getCurrencyRates, getCurrencyTokenRate, getDeletedEntryQueryOptions, getDiscoverCurationQueryOptions, getDiscoverLeaderboardQueryOptions, getDiscussion, getDiscussionQueryOptions, getDiscussionsQueryOptions, getDraftsQueryOptions, getDynamicPropsQueryOptions, getEntryActiveVotesQueryOptions, getFollowCountQueryOptions, getFollowingQueryOptions, getFragmentsQueryOptions, getFriendsInfiniteQueryOptions, getGalleryImagesQueryOptions, getGameStatusCheckQueryOptions, getHiveEngineMetrics, getHiveEngineOpenOrders, getHiveEngineOrderBook, getHiveEngineTokenMetrics, getHiveEngineTokenTransactions, getHiveEngineTokensBalances, getHiveEngineTokensMarket, getHiveEngineTokensMetadata, getHiveEngineTradeHistory, getHiveEngineUnclaimedRewards, getHiveHbdStatsQueryOptions, getHivePoshLinksQueryOptions, getHivePrice, getImagesQueryOptions, getIncomingRcQueryOptions, getMarketData, getMarketDataQueryOptions, getMarketHistoryQueryOptions, getMarketStatisticsQueryOptions, getMutedUsersQueryOptions, getNormalizePostQueryOptions, getNotificationSetting, getNotifications, getNotificationsInfiniteQueryOptions, getNotificationsSettingsQueryOptions, getNotificationsUnreadCountQueryOptions, getOpenOrdersQueryOptions, getOrderBookQueryOptions, getOutgoingRcDelegationsInfiniteQueryOptions, getPageStatsQueryOptions, getPointsQueryOptions, getPost, getPostHeader, getPostHeaderQueryOptions, getPostQueryOptions, getPostTipsQueryOptions, getPostsRanked, getPostsRankedInfiniteQueryOptions, getPostsRankedQueryOptions, getProfiles, getProfilesQueryOptions, getPromotePriceQueryOptions, getPromotedPost, getPromotedPostsQuery, getProposalQueryOptions, getProposalVotesInfiniteQueryOptions, getProposalsQueryOptions, getQueryClient, getRcStatsQueryOptions, getReblogsQueryOptions, getReceivedVestingSharesQueryOptions, getReferralsInfiniteQueryOptions, getReferralsStatsQueryOptions, getRelationshipBetweenAccounts, getRelationshipBetweenAccountsQueryOptions, getRewardedCommunitiesQueryOptions, getSavingsWithdrawFromQueryOptions, getSchedulesQueryOptions, getSearchAccountQueryOptions, getSearchAccountsByUsernameQueryOptions, getSearchApiInfiniteQueryOptions, getSearchFriendsQueryOptions, getSearchPathQueryOptions, getSearchTopicsQueryOptions, getSimilarEntriesQueryOptions, getSpkMarkets, getSpkWallet, getStatsQueryOptions, getSubscribers, getSubscriptions, getTradeHistoryQueryOptions, getTransactionsInfiniteQueryOptions, getTrendingTagsQueryOptions, getTrendingTagsWithStatsQueryOptions, getUserProposalVotesQueryOptions, getVestingDelegationsQueryOptions, getVisibleFirstLevelThreadItems, getWavesByHostQueryOptions, getWavesByTagQueryOptions, getWavesFollowingQueryOptions, getWavesTrendingTagsQueryOptions, getWithdrawRoutesQueryOptions, getWitnessesInfiniteQueryOptions, hsTokenRenew, isCommunity, lookupAccountsQueryOptions, makeQueryClient, mapThreadItemsToWaveEntries, markNotifications, moveSchedule, normalizePost, normalizeWaveEntryFromApi, onboardEmail, parseAccounts, parseAsset, parseProfileMetadata, powerRechargeTime, rcPower, resolvePost, roleMap, saveNotificationSetting, search, searchAccount, searchPath, searchQueryOptions, searchTag, signUp, sortDiscussions, subscribeEmail, toEntryArray, updateDraft, uploadImage, useAccountFavouriteAdd, useAccountFavouriteDelete, useAccountRelationsUpdate, useAccountRevokeKey, useAccountRevokePosting, useAccountUpdate, useAccountUpdateKeyAuths, useAccountUpdatePassword, useAccountUpdateRecovery, useAddFragment, useBookmarkAdd, useBookmarkDelete, useBroadcastMutation, useEditFragment, useGameClaim, useRecordActivity, useRemoveFragment, useSignOperationByHivesigner, useSignOperationByKey, useSignOperationByKeychain, usrActivity, validatePostCreating, votingPower, votingValue };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map