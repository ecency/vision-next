'use strict';

var reactQuery = require('@tanstack/react-query');
var dhive = require('@hiveio/dhive');
var hs = require('hivesigner');
var R4 = require('remeda');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var hs__default = /*#__PURE__*/_interopDefault(hs);
var R4__namespace = /*#__PURE__*/_interopNamespace(R4);

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
  hiveClient: new dhive.Client(
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
  queryClient: new reactQuery.QueryClient(),
  plausibleHost: "https://pl.ecency.com",
  spkNode: "https://spk.good-karma.xyz"
};
exports.ConfigManager = void 0;
((ConfigManager2) => {
  function setQueryClient(client) {
    CONFIG.queryClient = client;
  }
  ConfigManager2.setQueryClient = setQueryClient;
})(exports.ConfigManager || (exports.ConfigManager = {}));

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
  return reactQuery.useMutation({
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
        const privateKey = dhive.PrivateKey.fromString(postingKey);
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
    const privateKey = dhive.PrivateKey.fromString(postingKey);
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
    const response = await new hs__default.default.Client({
      accessToken: token
    }).customJson([], [username], id, JSON.stringify(payload));
    return response.result;
  }
  throw new Error(
    "[SDK][Broadcast] \u2013 cannot broadcast w/o posting key or token"
  );
}
function makeQueryClient() {
  return new reactQuery.QueryClient({
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
exports.EcencyQueriesManager = void 0;
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
      useClientQuery: () => reactQuery.useQuery(options),
      fetchAndGet: () => getQueryClient().fetchQuery(options)
    };
  }
  EcencyQueriesManager2.generateClientServerQuery = generateClientServerQuery;
  function generateClientServerInfiniteQuery(options) {
    return {
      prefetch: () => prefetchInfiniteQuery(options),
      getData: () => getInfiniteQueryData(options.queryKey),
      useClientQuery: () => reactQuery.useInfiniteQuery(options),
      fetchAndGet: () => getQueryClient().fetchInfiniteQuery(options)
    };
  }
  EcencyQueriesManager2.generateClientServerInfiniteQuery = generateClientServerInfiniteQuery;
})(exports.EcencyQueriesManager || (exports.EcencyQueriesManager = {}));
function getDynamicPropsQueryOptions() {
  return reactQuery.queryOptions({
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

// src/modules/core/dmca-accounts.json
var dmca_accounts_default = [
  "aasdaura",
  "aditya01103",
  "ah3p5idsebhn",
  "aishacorona",
  "allenk",
  "andrew01",
  "andrewmiller",
  "andrewson",
  "anny08",
  "arefinishingpros",
  "beeryallen",
  "billjd",
  "binance.help",
  "binance.support",
  "binanceehelp",
  "binancesupport",
  "binancesupport1",
  "binancesupportt",
  "binancetoll",
  "bio9kftyptni",
  "bitcoinsmarkett",
  "blockchaink",
  "blockdifind",
  "borajogar",
  "bqtumaeso0zl",
  "brbaramille",
  "btcbtcgvsagvcsa",
  "btccare",
  "btcservice",
  "btcsupportcare",
  "c4bqqi5jzf46",
  "callcbsupport",
  "callscoinbase",
  "carenumber",
  "caresuppoert",
  "caval",
  "cbservice",
  "cbsupport",
  "cbsupportnumber",
  "cbsupportservice",
  "cex.iosupport",
  "coinbase-usa",
  "coinbase.care",
  "coinbase.help",
  "coinbase.service",
  "coinbase.support",
  "coinbasecall",
  "coinbasecall1",
  "coinbasecalls",
  "coinbasecare",
  "coinbasedesk",
  "coinbaseeus",
  "coinbasefree",
  "coinbasegold",
  "coinbasehelpline",
  "coinbasehelps",
  "coinbaselogin",
  "coinbaseloginn",
  "coinbaseno",
  "coinbasepay",
  "coinbasephn",
  "coinbasereal",
  "coinbasertss",
  "coinbaseservice",
  "coinbaseservicen",
  "coinbaseservices",
  "coinbasessup",
  "coinbassupport",
  "coinbasesupp",
  "coinbasesupport",
  "coinbasesupportc",
  "coinbasesupportp",
  "coinbasesupports",
  "coinbasesupportt",
  "coinbasesuprt",
  "coinbasetollfree",
  "coinbasetollfree",
  "coinbaseuk",
  "coinbaseuk",
  "coinbaseus",
  "coinbaseus.com",
  "coinbaseusa",
  "coinbasewallet",
  "coinbascare",
  "coinbbasepro",
  "coinbashelp",
  "coinbesesupport",
  "coinsbasesup",
  "communicateus",
  "communityus",
  "contactmetamask",
  "costaricht",
  "cplahariya72",
  "cryptoservice",
  "cryptosupports",
  "cryptotokens",
  "cryptousero1",
  "customer.service",
  "customer800",
  "customercare",
  "customerlive",
  "customeronline",
  "customerservice",
  "customerservice",
  "customersupport",
  "customtoll",
  "customtoll",
  "customerwallet",
  "cxcbnxzcb",
  "damiwiy184",
  "darkknight11",
  "davidsenk",
  "devisoncik",
  "dfdsfd45",
  "dialcoinbase",
  "diego-dumalo",
  "djwtu",
  "duncanjosie918",
  "ecencepop",
  "ecency01",
  "ecencymaster",
  "edwardspensor",
  "ellamason612",
  "emailbackup",
  "ericahonolu",
  "eseoexpert",
  "evamay",
  "faumaulloin",
  "ficih425",
  "foul1uxqcse6",
  "frankkohn",
  "geminiusa",
  "genegg691",
  "gharkibook897",
  "ggyivaiapyju",
  "ginas1900",
  "greekbar",
  "gugytgydvvv",
  "gunman4466",
  "guthrie121",
  "hackmon90",
  "harryxosborn",
  "hasnain-khan",
  "havrecamey",
  "help.coinbase",
  "helpbinancee",
  "helpcoinbas",
  "helpcoinbase",
  "helplinesupport",
  "hikccbsc5k",
  "hoachatgiahoang",
  "iag9479",
  "isaacsmith",
  "istoprocent",
  "jack0vdug3wp",
  "jack0w0qdnqn",
  "jack1lztfaow",
  "jack38x8jq2a",
  "jack3ilzkctt",
  "jack42beq2my",
  "jack5ft0p6iu",
  "jack5ivh6uxt",
  "jack5tq5vy3f",
  "jack6ha8jmjy",
  "jack7hn6sds8",
  "jack7u0ss1qr",
  "jack8w0y7qs6",
  "jackg87s0zx7",
  "jackgpvkd22t",
  "jackmop0vhoy",
  "jacknpgoya4o",
  "jackocd64ha0",
  "jackph9ajwab",
  "jackufaghpz6",
  "jackv075h3rc",
  "jackyykb7gk1",
  "jacksparrowcz",
  "jacksparrowzx",
  "jaibalaj123",
  "jakelaw915",
  "jallhlcv8",
  "jameesspaul",
  "james326",
  "jamesniton675",
  "janeliz72",
  "janiceadams",
  "jayapartha",
  "jhagsdh265",
  "jimmyshergillxz",
  "joannegdunn",
  "jonathonsmithsz",
  "jonydevitis",
  "justinkanwal",
  "jundi1",
  "kalimkopaaer",
  "karolinalowe",
  "kclentroaster",
  "kirstyxnaylor",
  "kissmenotddvf",
  "krakensupport",
  "lawadvisorbd",
  "leasha",
  "ledgernano",
  "ledgernanohelp",
  "ledgernanox",
  "ledgernanoy",
  "lindacare87",
  "lisachapaul",
  "lobstrsupport",
  "lobstrusa",
  "loginpending",
  "londonclimate",
  "lumiwallet",
  "lylezmclean",
  "marianagtz",
  "mariasmith",
  "marimcalister4",
  "markalan",
  "marquisea",
  "marsila",
  "masonalistair",
  "meaghanhowe",
  "melodi",
  "metamask.support",
  "metamasklive",
  "metamaskliveus",
  "metamaskloginus",
  "metamasksupport",
  "metamasksupportu",
  "metamaskus",
  "mmcrypto1",
  "mmfuture",
  "mondkratzert5445",
  "moonpay.wallet",
  "moonpaysupport",
  "morisjay",
  "mzibli",
  "nalucasino22",
  "naomismith113",
  "narniatailor",
  "nehemiahc",
  "nickfurrie",
  "nickfuryx",
  "npleasent",
  "nwekennmd",
  "nzjow69",
  "oliver7219jeny",
  "oliviajames7",
  "omotayoaina",
  "onobel",
  "p90usskw36tv",
  "paulfjones966",
  "perciejacksondxc",
  "pesen05",
  "phbgg",
  "pintowallet",
  "poilebraubragra",
  "pramodranis",
  "precimeasure",
  "psejsvtk9547",
  "qctaviwx",
  "rajniraraa",
  "rarec44537",
  "razvape",
  "razvapes",
  "rcxrvaarejthw",
  "recoversupport",
  "rejora",
  "rewqas568",
  "ronkasp",
  "samuel2000",
  "samuel2004",
  "samuel2005",
  "samuel2006",
  "samuel2007",
  "samuel2008",
  "samuel2009",
  "samuel2011",
  "samuel2012",
  "samuel2015",
  "samuel2016",
  "samuel2018",
  "samuel210",
  "samueldoctor2019",
  "sanjiv",
  "sdeborah824",
  "service.customer",
  "servicecoinbase",
  "servicehelp",
  "shaunxcannon",
  "shepardbernard2",
  "slavedirk",
  "sofiazwayne",
  "starct053",
  "stayrene",
  "stelladario123",
  "stephenyjohnsn",
  "sterex",
  "stoponyavin",
  "sscomm",
  "support.binance",
  "support.coinbase",
  "support.gemini",
  "support.metamask",
  "support.tollfree",
  "support.wallet",
  "supportcare",
  "supportcoinbase",
  "supportdodge",
  "supporthelp",
  "supporthelp",
  "supportnumber",
  "supportnumberbit",
  "supportnumberus",
  "supportrefund",
  "sylvestestalom",
  "synyppzvv3ub",
  "systembuster",
  "tedsx7347848",
  "techonoal",
  "technicalusa",
  "techsupport1",
  "tenda",
  "terimaachuma",
  "tklbidramu",
  "tollfree",
  "tollfrenumber",
  "trustcrypto",
  "trusttwallet",
  "trustwallett",
  "trustwalletuk",
  "trustwalletus",
  "ttja0lfaccoz",
  "tyuq3wg",
  "tzhpof",
  "unikarl",
  "uniswap24",
  "uniswaphelp",
  "uniswapsupport",
  "usacbservice",
  "usacoinbase",
  "uscoinbase.care",
  "usercoinbaseapp",
  "ustrustwallet",
  "venomawn",
  "veronicaxwilson",
  "veudufideprei",
  "vfdbvfgbvdfgdf",
  "vnpst9lynksk",
  "vohoho",
  "vojsjh79vzqu",
  "vzo6b8fs6ifu",
  "wallet.trust",
  "wallet.usa",
  "walletcrypto",
  "walletuscoin",
  "walletusa",
  "walletusa",
  "xcoinbbaseproxx",
  "xpertpackindia",
  "yedanad275",
  "zakiartist85y",
  "zhgsildfh",
  "zkbvu0tcv2la"
];
function getAccountFullQueryOptions(username) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  const metadata = R4__namespace.mergeDeep(
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
  const queryClient = reactQuery.useQueryClient();
  const { data } = reactQuery.useQuery(getAccountFullQueryOptions(username));
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
        const obj = R4__namespace.clone(data2);
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  const { data: accountData } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  return reactQuery.useMutation({
    mutationKey: ["accounts", "keys-update", username],
    mutationFn: async ({ keys, keepCurrent = false, currentKey }) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update keys for anon user"
        );
      }
      const prepareAuth = (keyName) => {
        const auth = R4__namespace.clone(accountData[keyName]);
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
  const { data: accountData } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  const { mutateAsync: updateKeys } = useAccountUpdateKeyAuths(username);
  return reactQuery.useMutation({
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
      const currentKey = dhive.PrivateKey.fromLogin(
        username,
        currentPassword,
        "owner"
      );
      return updateKeys({
        currentKey,
        keepCurrent,
        keys: [
          {
            owner: dhive.PrivateKey.fromLogin(username, newPassword, "owner"),
            active: dhive.PrivateKey.fromLogin(username, newPassword, "active"),
            posting: dhive.PrivateKey.fromLogin(username, newPassword, "posting"),
            memo_key: dhive.PrivateKey.fromLogin(username, newPassword, "memo")
          }
        ]
      });
    },
    ...options
  });
}
function useAccountRevokePosting(username, options) {
  const queryClient = reactQuery.useQueryClient();
  const { data } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  return reactQuery.useMutation({
    mutationKey: ["accounts", "revoke-posting", data?.name],
    mutationFn: async ({ accountName, type, key }) => {
      if (!data) {
        throw new Error(
          "[SDK][Accounts] \u2013\xA0cannot revoke posting for anonymous user"
        );
      }
      const posting = R4__namespace.pipe(
        {},
        R4__namespace.mergeDeep(data.posting)
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
        return hs__default.default.sendOperation(
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
  const { data } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  return reactQuery.useMutation({
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
        return hs__default.default.sendOperation(
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
  const { data: accountData } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  return reactQuery.useMutation({
    mutationKey: ["accounts", "revoke-key", accountData?.name],
    mutationFn: async ({ currentKey, revokingKey }) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update keys for anon user"
        );
      }
      const prepareAuth = (keyName) => {
        const auth = R4__namespace.clone(accountData[keyName]);
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
  return reactQuery.useMutation({
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
        privateKey = dhive.PrivateKey.fromLogin(username, keyOrSeed, "active");
      } else if (dhive.cryptoUtils.isWif(keyOrSeed)) {
        privateKey = dhive.PrivateKey.fromString(keyOrSeed);
      } else {
        privateKey = dhive.PrivateKey.from(keyOrSeed);
      }
      return CONFIG.hiveClient.broadcast.sendOperations(
        [operation],
        privateKey
      );
    }
  });
}
function useSignOperationByKeychain(username, keyType = "Active") {
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
    mutationKey: ["operations", "sign-hivesigner", callbackUri],
    mutationFn: async ({ operation }) => {
      return hs__default.default.sendOperation(operation, { callback: callbackUri }, () => {
      });
    }
  });
}
function getChainPropertiesQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["operations", "chain-properties"],
    queryFn: async () => {
      return await CONFIG.hiveClient.database.getChainProperties();
    }
  });
}
function getTrendingTagsQueryOptions(limit = 20) {
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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

// src/modules/posts/functions/validate-entry.ts
function validateEntry(entry) {
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
    if (entry[prop] == null) {
      console.warn(
        `Entry validation: ${prop} is null/undefined for @${entry.author || "unknown"}/${entry.permlink || "unknown"}, setting to empty string`
      );
      entry[prop] = "";
    }
  }
  if (entry.author_reputation == null) {
    console.warn(
      `Entry validation: author_reputation is null/undefined for @${entry.author}/${entry.permlink}, setting to 0`
    );
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
      total_votes: 0
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

// src/modules/posts/queries/get-post-query-options.ts
function getPostQueryOptions(author, permlink, observer = "", num) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "post", author, permlink],
    queryFn: async () => {
      const resp = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink,
        observer
      });
      if (resp) {
        const validatedEntry = validateEntry(resp);
        const post = await resolvePost(validatedEntry, observer, num);
        if (dmca_accounts_default.some(
          (rx) => new RegExp(rx).test(`@${post.author}/${post.permlink}`)
        )) {
          post.body = "This post is not available due to a copyright/fraudulent claim.";
          post.title = "";
        }
        return post;
      }
      return void 0;
    }
  });
}
async function resolvePost(post, observer, num) {
  const { json_metadata: json } = post;
  if (json?.original_author && json?.original_permlink && json.tags?.[0] === "cross-post") {
    try {
      const query = getPostQueryOptions(
        json.original_author,
        json.original_permlink,
        observer,
        num
      );
      await CONFIG.queryClient.prefetchQuery(query);
      const resp = await CONFIG.queryClient.getQueryData(query.queryKey);
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
}

// src/modules/posts/queries/get-account-posts-query-options.ts
var getAccountPostsQueryOptions = ({
  username,
  filter = "posts",
  limit = 20,
  observer = "",
  enabled = true
}) => reactQuery.infiniteQueryOptions({
  queryKey: ["posts", "account-posts", username, filter, limit],
  enabled: !!username && enabled,
  initialData: { pages: [], pageParams: [] },
  initialPageParam: {
    author: void 0,
    permlink: void 0,
    hasNextPage: true
  },
  queryFn: async ({ pageParam }) => {
    if (!pageParam.hasNextPage || !username) return [];
    const rpcParams = {
      sort: filter,
      account: username,
      limit,
      ...observer !== void 0 ? { observer } : {},
      ...pageParam.author ? { start_author: pageParam.author } : {},
      ...pageParam.permlink ? { start_permlink: pageParam.permlink } : {}
    };
    try {
      if (dmca_accounts_default.includes(username)) return [];
      const resp = await CONFIG.hiveClient.call(
        "bridge",
        "get_account_posts",
        rpcParams
      );
      if (resp && Array.isArray(resp)) {
        return Promise.all(resp.map((p) => resolvePost(p, observer)));
      }
      return [];
    } catch (err) {
      return [];
    }
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
function useAddFragment(username) {
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
      const accessToken = getAccessToken(username);
      if (accessToken) {
        const hsClient = new hs__default.default.Client({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
    queryKey: ["resource-credits", "account", username],
    queryFn: async () => {
      const rcClient = new dhive.RCAPI(CONFIG.hiveClient);
      return rcClient.findRCAccounts([username]);
    },
    enabled: !!username
  });
}
function getGameStatusCheckQueryOptions(username, gameType) {
  return reactQuery.queryOptions({
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
  return reactQuery.useMutation({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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

exports.CONFIG = CONFIG;
exports.EcencyAnalytics = mutations_exports;
exports.HiveSignerIntegration = HiveSignerIntegration;
exports.Keychain = keychain_exports;
exports.NaiMap = NaiMap;
exports.ROLES = ROLES;
exports.Symbol = Symbol2;
exports.ThreeSpeakIntegration = ThreeSpeakIntegration;
exports.broadcastJson = broadcastJson;
exports.buildProfileMetadata = buildProfileMetadata;
exports.checkUsernameWalletsPendingQueryOptions = checkUsernameWalletsPendingQueryOptions;
exports.decodeObj = decodeObj;
exports.dedupeAndSortKeyAuths = dedupeAndSortKeyAuths;
exports.dmca_accounts = dmca_accounts_default;
exports.encodeObj = encodeObj;
exports.extractAccountProfile = extractAccountProfile;
exports.getAccessToken = getAccessToken;
exports.getAccountFullQueryOptions = getAccountFullQueryOptions;
exports.getAccountPendingRecoveryQueryOptions = getAccountPendingRecoveryQueryOptions;
exports.getAccountPostsQueryOptions = getAccountPostsQueryOptions;
exports.getAccountRcQueryOptions = getAccountRcQueryOptions;
exports.getAccountRecoveriesQueryOptions = getAccountRecoveriesQueryOptions;
exports.getAccountSubscriptionsQueryOptions = getAccountSubscriptionsQueryOptions;
exports.getActiveAccountBookmarksQueryOptions = getActiveAccountBookmarksQueryOptions;
exports.getActiveAccountFavouritesQueryOptions = getActiveAccountFavouritesQueryOptions;
exports.getBoundFetch = getBoundFetch;
exports.getChainPropertiesQueryOptions = getChainPropertiesQueryOptions;
exports.getCommunitiesQueryOptions = getCommunitiesQueryOptions;
exports.getCommunityContextQueryOptions = getCommunityContextQueryOptions;
exports.getCommunityPermissions = getCommunityPermissions;
exports.getCommunityType = getCommunityType;
exports.getDynamicPropsQueryOptions = getDynamicPropsQueryOptions;
exports.getFragmentsQueryOptions = getFragmentsQueryOptions;
exports.getGameStatusCheckQueryOptions = getGameStatusCheckQueryOptions;
exports.getHivePoshLinksQueryOptions = getHivePoshLinksQueryOptions;
exports.getLoginType = getLoginType;
exports.getPostingKey = getPostingKey;
exports.getPromotedPostsQuery = getPromotedPostsQuery;
exports.getQueryClient = getQueryClient;
exports.getRcStatsQueryOptions = getRcStatsQueryOptions;
exports.getRefreshToken = getRefreshToken;
exports.getRelationshipBetweenAccountsQueryOptions = getRelationshipBetweenAccountsQueryOptions;
exports.getSearchAccountsByUsernameQueryOptions = getSearchAccountsByUsernameQueryOptions;
exports.getStatsQueryOptions = getStatsQueryOptions;
exports.getTrendingTagsQueryOptions = getTrendingTagsQueryOptions;
exports.getUser = getUser;
exports.makeQueryClient = makeQueryClient;
exports.parseAsset = parseAsset;
exports.parseProfileMetadata = parseProfileMetadata;
exports.roleMap = roleMap;
exports.useAccountFavouriteAdd = useAccountFavouriteAdd;
exports.useAccountFavouriteDelete = useAccountFavouriteDelete;
exports.useAccountRelationsUpdate = useAccountRelationsUpdate;
exports.useAccountRevokeKey = useAccountRevokeKey;
exports.useAccountRevokePosting = useAccountRevokePosting;
exports.useAccountUpdate = useAccountUpdate;
exports.useAccountUpdateKeyAuths = useAccountUpdateKeyAuths;
exports.useAccountUpdatePassword = useAccountUpdatePassword;
exports.useAccountUpdateRecovery = useAccountUpdateRecovery;
exports.useAddFragment = useAddFragment;
exports.useBookmarkAdd = useBookmarkAdd;
exports.useBookmarkDelete = useBookmarkDelete;
exports.useBroadcastMutation = useBroadcastMutation;
exports.useEditFragment = useEditFragment;
exports.useGameClaim = useGameClaim;
exports.useRemoveFragment = useRemoveFragment;
exports.useSignOperationByHivesigner = useSignOperationByHivesigner;
exports.useSignOperationByKey = useSignOperationByKey;
exports.useSignOperationByKeychain = useSignOperationByKeychain;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map