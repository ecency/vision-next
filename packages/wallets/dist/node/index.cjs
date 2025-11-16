'use strict';

var sdk = require('@ecency/sdk');
var reactQuery = require('@tanstack/react-query');
var bip39 = require('bip39');
var lruCache = require('lru-cache');
var coinBitcoin = require('@okxweb3/coin-bitcoin');
var coinEthereum = require('@okxweb3/coin-ethereum');
var coinTron = require('@okxweb3/coin-tron');
var coinTon = require('@okxweb3/coin-ton');
var coinSolana = require('@okxweb3/coin-solana');
var coinAptos = require('@okxweb3/coin-aptos');
var cryptoLib = require('@okxweb3/crypto-lib');
var dhive = require('@hiveio/dhive');
var crypto = require('@hiveio/dhive/lib/crypto');
var memo = require('@hiveio/dhive/lib/memo');
var dayjs = require('dayjs');
var hs = require('hivesigner');
var R = require('remeda');

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

var bip39__default = /*#__PURE__*/_interopDefault(bip39);
var dayjs__default = /*#__PURE__*/_interopDefault(dayjs);
var hs__default = /*#__PURE__*/_interopDefault(hs);
var R__namespace = /*#__PURE__*/_interopNamespace(R);

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/internal/scrypt-guard.ts
var globalLike = globalThis;
if (typeof globalLike._scrypt_bsv !== "undefined") {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }
  try {
    delete globalLike._scrypt_bsv;
  } catch {
    globalLike._scrypt_bsv = void 0;
  }
}
function rememberScryptBsvVersion() {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }
}

// src/modules/wallets/enums/ecency-wallet-currency.ts
var EcencyWalletCurrency = /* @__PURE__ */ ((EcencyWalletCurrency2) => {
  EcencyWalletCurrency2["BTC"] = "BTC";
  EcencyWalletCurrency2["ETH"] = "ETH";
  EcencyWalletCurrency2["BNB"] = "BNB";
  EcencyWalletCurrency2["APT"] = "APT";
  EcencyWalletCurrency2["TON"] = "TON";
  EcencyWalletCurrency2["TRON"] = "TRX";
  EcencyWalletCurrency2["SOL"] = "SOL";
  return EcencyWalletCurrency2;
})(EcencyWalletCurrency || {});

// src/modules/wallets/enums/ecency-wallet-basic-tokens.ts
var EcencyWalletBasicTokens = /* @__PURE__ */ ((EcencyWalletBasicTokens2) => {
  EcencyWalletBasicTokens2["Points"] = "POINTS";
  EcencyWalletBasicTokens2["HivePower"] = "HP";
  EcencyWalletBasicTokens2["Hive"] = "HIVE";
  EcencyWalletBasicTokens2["HiveDollar"] = "HBD";
  return EcencyWalletBasicTokens2;
})(EcencyWalletBasicTokens || {});
var currencyChainMap = {
  ["BTC" /* BTC */]: "btc",
  ["ETH" /* ETH */]: "eth",
  ["BNB" /* BNB */]: "bnb",
  ["SOL" /* SOL */]: "sol",
  ["TRX" /* TRON */]: "tron",
  ["TON" /* TON */]: "ton",
  ["APT" /* APT */]: "apt"
};
function normalizeBalance(balance) {
  if (typeof balance === "number") {
    if (!Number.isFinite(balance)) {
      throw new Error("Private API returned a non-finite numeric balance");
    }
    return Math.trunc(balance).toString();
  }
  if (typeof balance === "string") {
    const trimmed = balance.trim();
    if (trimmed === "") {
      throw new Error("Private API returned an empty balance string");
    }
    return trimmed;
  }
  throw new Error("Private API returned balance in an unexpected format");
}
function parsePrivateApiBalance(result, expectedChain) {
  if (!result || typeof result !== "object") {
    throw new Error("Private API returned an unexpected response");
  }
  const { chain, balance, unit, raw, nodeId } = result;
  if (typeof chain !== "string" || chain !== expectedChain) {
    throw new Error("Private API response chain did not match request");
  }
  if (typeof unit !== "string" || unit.length === 0) {
    throw new Error("Private API response is missing unit information");
  }
  if (balance === void 0 || balance === null) {
    throw new Error("Private API response is missing balance information");
  }
  const balanceString = normalizeBalance(balance);
  let balanceBigInt;
  try {
    balanceBigInt = BigInt(balanceString);
  } catch (error) {
    throw new Error("Private API returned a balance that is not an integer");
  }
  return {
    chain,
    unit,
    raw,
    nodeId: typeof nodeId === "string" && nodeId.length > 0 ? nodeId : void 0,
    balanceBigInt,
    balanceString
  };
}
function useGetExternalWalletBalanceQuery(currency, address) {
  return reactQuery.useQuery({
    queryKey: ["ecency-wallets", "external-wallet-balance", currency, address],
    queryFn: async () => {
      const chain = currencyChainMap[currency];
      if (!chain) {
        throw new Error(`Unsupported currency ${currency}`);
      }
      if (!sdk.CONFIG.privateApiHost) {
        throw new Error("Private API host is not configured");
      }
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/${chain}/${encodeURIComponent(
        address
      )}`;
      let primaryResponse;
      let primaryError;
      try {
        primaryResponse = await fetch(baseUrl);
      } catch (error) {
        primaryError = error;
      }
      let response = primaryResponse;
      if (!response || !response.ok) {
        const fallbackUrl = `${baseUrl}?provider=chainz`;
        let fallbackError;
        try {
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            response = fallbackResponse;
          } else {
            fallbackError = new Error(
              `Fallback provider responded with status ${fallbackResponse.status}`
            );
          }
        } catch (error) {
          fallbackError = error;
        }
        if (!response || !response.ok) {
          const failureReasons = [];
          if (primaryError) {
            const message = primaryError instanceof Error ? primaryError.message : String(primaryError);
            failureReasons.push(`primary provider failed: ${message}`);
          } else if (primaryResponse && !primaryResponse.ok) {
            failureReasons.push(
              `primary provider status ${primaryResponse.status}`
            );
          }
          if (fallbackError) {
            const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            failureReasons.push(`fallback provider failed: ${message}`);
          }
          if (failureReasons.length === 0) {
            failureReasons.push("unknown error");
          }
          throw new Error(
            `Private API request failed (${failureReasons.join(", ")})`
          );
        }
      }
      const result = await response.json();
      return parsePrivateApiBalance(result, chain);
    }
  });
}
function useSeedPhrase(username) {
  return reactQuery.useQuery({
    queryKey: ["ecency-wallets", "seed", username],
    queryFn: async () => bip39__default.default.generateMnemonic(128)
  });
}
var options = {
  max: 500,
  // how long to live in ms
  ttl: 1e3 * 60 * 5,
  // return stale items before removing from cache?
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false
};
var cache = new lruCache.LRUCache(options);
var undefinedValue = Symbol("undefined");
var cacheSet = (key, value) => cache.set(key, value === void 0 ? undefinedValue : value);
var cacheGet = (key) => {
  const v = cache.get(key);
  return v === undefinedValue ? void 0 : v;
};
var CURRENCY_TO_TOKEN_MAP = {
  ["BTC" /* BTC */]: "btc",
  ["ETH" /* ETH */]: "eth",
  ["SOL" /* SOL */]: "sol",
  ["TON" /* TON */]: "ton",
  ["TRX" /* TRON */]: "trx",
  ["APT" /* APT */]: "apt",
  ["BNB" /* BNB */]: "bnb",
  HBD: "hbd",
  HIVE: "hive"
};
var MARKET_DATA_CACHE_KEY = "market-data/latest";
var normalizeCurrencyToToken = (currency) => {
  const upperCased = currency.toUpperCase();
  return CURRENCY_TO_TOKEN_MAP[upperCased] ?? currency.toLowerCase();
};
function getTokenPriceQueryOptions(currency) {
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "market-data", currency],
    queryFn: async () => {
      if (!currency) {
        throw new Error(
          "[SDK][Wallets][MarketData] \u2013 currency wasn`t provided"
        );
      }
      if (!sdk.CONFIG.privateApiHost) {
        throw new Error(
          "[SDK][Wallets][MarketData] \u2013 privateApiHost isn`t configured"
        );
      }
      const token = normalizeCurrencyToToken(currency);
      let marketData = cacheGet(MARKET_DATA_CACHE_KEY);
      if (!marketData) {
        const httpResponse = await fetch(
          `${sdk.CONFIG.privateApiHost}/private-api/market-data/latest`,
          {
            method: "GET"
          }
        );
        if (!httpResponse.ok) {
          throw new Error(
            `[SDK][Wallets][MarketData] \u2013 failed to fetch latest market data (${httpResponse.status})`
          );
        }
        const data = await httpResponse.json();
        cacheSet(MARKET_DATA_CACHE_KEY, data);
        marketData = data;
      }
      const tokenData = marketData[token];
      if (!tokenData) {
        throw new Error(
          `[SDK][Wallets][MarketData] \u2013 missing market data for token: ${token}`
        );
      }
      const usdQuote = tokenData.quotes?.usd;
      if (!usdQuote) {
        throw new Error(
          `[SDK][Wallets][MarketData] \u2013 missing USD quote for token: ${token}`
        );
      }
      return Number(usdQuote.price);
    },
    enabled: !!currency
  });
}

// src/modules/wallets/utils/delay.ts
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getWallet(currency) {
  switch (currency) {
    case "BTC" /* BTC */:
      return new coinBitcoin.BtcWallet();
    case "ETH" /* ETH */:
    case "BNB" /* BNB */:
      return new coinEthereum.EthWallet();
    case "TRX" /* TRON */:
      return new coinTron.TrxWallet();
    case "TON" /* TON */:
      return new coinTon.TonWallet();
    case "SOL" /* SOL */:
      return new coinSolana.SolWallet();
    case "APT" /* APT */:
      return new coinAptos.AptosWallet();
    default:
      return void 0;
  }
}
function mnemonicToSeedBip39(value) {
  return bip39.mnemonicToSeedSync(value).toString("hex");
}
var ROLE_INDEX = {
  owner: 0,
  active: 1,
  posting: 2,
  memo: 3
};
function deriveHiveKey(mnemonic, role, accountIndex = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = cryptoLib.bip32.fromSeed(seed);
  const path = `m/44'/3054'/${accountIndex}'/0'/${ROLE_INDEX[role]}'`;
  const child = master.derivePath(path);
  if (!child.privateKey) {
    throw new Error("[Ecency][Wallets] - hive key derivation failed");
  }
  const pk = dhive.PrivateKey.from(child.privateKey);
  return {
    privateKey: pk.toString(),
    publicKey: pk.createPublic().toString()
  };
}
function deriveHiveKeys(mnemonic, accountIndex = 0) {
  const owner = deriveHiveKey(mnemonic, "owner", accountIndex);
  const active = deriveHiveKey(mnemonic, "active", accountIndex);
  const posting = deriveHiveKey(mnemonic, "posting", accountIndex);
  const memo = deriveHiveKey(mnemonic, "memo", accountIndex);
  return {
    owner: owner.privateKey,
    active: active.privateKey,
    posting: posting.privateKey,
    memo: memo.privateKey,
    ownerPubkey: owner.publicKey,
    activePubkey: active.publicKey,
    postingPubkey: posting.publicKey,
    memoPubkey: memo.publicKey
  };
}
function deriveHiveMasterPasswordKey(username, masterPassword, role) {
  const pk = dhive.PrivateKey.fromLogin(username, masterPassword, role);
  return {
    privateKey: pk.toString(),
    publicKey: pk.createPublic().toString()
  };
}
function deriveHiveMasterPasswordKeys(username, masterPassword) {
  const owner = deriveHiveMasterPasswordKey(username, masterPassword, "owner");
  const active = deriveHiveMasterPasswordKey(username, masterPassword, "active");
  const posting = deriveHiveMasterPasswordKey(
    username,
    masterPassword,
    "posting"
  );
  const memo = deriveHiveMasterPasswordKey(username, masterPassword, "memo");
  return {
    owner: owner.privateKey,
    active: active.privateKey,
    posting: posting.privateKey,
    memo: memo.privateKey,
    ownerPubkey: owner.publicKey,
    activePubkey: active.publicKey,
    postingPubkey: posting.publicKey,
    memoPubkey: memo.publicKey
  };
}
async function detectHiveKeyDerivation(username, seed, type = "active") {
  const uname = username.trim().toLowerCase();
  const account = await sdk.CONFIG.queryClient.fetchQuery(
    sdk.getAccountFullQueryOptions(uname)
  );
  const auth = account[type];
  const bip44 = deriveHiveKeys(seed);
  const bip44Pub = type === "owner" ? bip44.ownerPubkey : bip44.activePubkey;
  const matchBip44 = auth.key_auths.some(([pub]) => String(pub) === bip44Pub);
  if (matchBip44) return "bip44";
  const legacyPub = dhive.PrivateKey.fromLogin(uname, seed, type).createPublic().toString();
  const matchLegacy = auth.key_auths.some(([pub]) => String(pub) === legacyPub);
  if (matchLegacy) return "master-password";
  return "unknown";
}
function signDigest(digest, privateKey) {
  const key = dhive.PrivateKey.fromString(privateKey);
  const buf = typeof digest === "string" ? Buffer.from(digest, "hex") : digest;
  return key.sign(buf).toString();
}
function signTx(tx, privateKey, chainId) {
  const key = dhive.PrivateKey.fromString(privateKey);
  const chain = chainId ? Buffer.from(chainId, "hex") : void 0;
  return crypto.cryptoUtils.signTransaction(tx, key, chain);
}
async function signTxAndBroadcast(client, tx, privateKey, chainId) {
  const signed = signTx(tx, privateKey, chainId);
  return client.broadcast.send(signed);
}
function encryptMemoWithKeys(privateKey, publicKey, memo$1) {
  return memo.Memo.encode(dhive.PrivateKey.fromString(privateKey), publicKey, memo$1);
}
async function encryptMemoWithAccounts(client, fromPrivateKey, toAccount, memo$1) {
  const [account] = await client.database.getAccounts([toAccount]);
  if (!account) {
    throw new Error("Account not found");
  }
  return memo.Memo.encode(dhive.PrivateKey.fromString(fromPrivateKey), account.memo_key, memo$1);
}
function decryptMemoWithKeys(privateKey, memo$1) {
  return memo.Memo.decode(dhive.PrivateKey.fromString(privateKey), memo$1);
}
var decryptMemoWithAccounts = decryptMemoWithKeys;
async function signExternalTx(currency, params) {
  const wallet = getWallet(currency);
  if (!wallet) throw new Error("Unsupported currency");
  return wallet.signTransaction(params);
}
async function signExternalTxAndBroadcast(currency, params) {
  const signed = await signExternalTx(currency, params);
  switch (currency) {
    case "BTC" /* BTC */: {
      const res = await fetch("https://mempool.space/api/tx", {
        method: "POST",
        body: signed
      });
      if (!res.ok) throw new Error("Broadcast failed");
      return res.text();
    }
    case "ETH" /* ETH */:
    case "BNB" /* BNB */: {
      const rpcUrl = currency === "ETH" /* ETH */ ? "https://rpc.ankr.com/eth" : "https://bsc-dataseed.binance.org";
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_sendRawTransaction",
          params: [signed]
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    }
    case "SOL" /* SOL */: {
      const res = await fetch(
        `https://rpc.helius.xyz/?api-key=${sdk.CONFIG.heliusApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sendTransaction",
            params: [signed]
          })
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    }
    case "TRX" /* TRON */: {
      const res = await fetch(
        "https://api.trongrid.io/wallet/broadcasttransaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: typeof signed === "string" ? signed : JSON.stringify(signed)
        }
      );
      const json = await res.json();
      if (json.result === false) throw new Error(json.message);
      return json.txid || json.result;
    }
    case "TON" /* TON */: {
      const res = await fetch("https://toncenter.com/api/v2/sendTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boc: signed })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || json.result);
      return json.result;
    }
    case "APT" /* APT */: {
      const res = await fetch(
        "https://fullnode.mainnet.aptoslabs.com/v1/transactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: typeof signed === "string" ? signed : JSON.stringify(signed)
        }
      );
      if (!res.ok) throw new Error("Broadcast failed");
      return res.json();
    }
    default:
      throw new Error("Unsupported currency");
  }
}
function buildPsbt(tx, network, maximumFeeRate) {
  return coinBitcoin.buildPsbt(tx, network, maximumFeeRate);
}
function buildEthTx(data) {
  return data;
}
function buildSolTx(data) {
  return data;
}
function buildTronTx(data) {
  return data;
}
function buildTonTx(data) {
  return data;
}
function buildAptTx(data) {
  return data;
}
function buildExternalTx(currency, tx) {
  switch (currency) {
    case "BTC" /* BTC */:
      return buildPsbt(tx);
    case "ETH" /* ETH */:
    case "BNB" /* BNB */:
      return buildEthTx(tx);
    case "SOL" /* SOL */:
      return buildSolTx(tx);
    case "TRX" /* TRON */:
      return buildTronTx(tx);
    case "TON" /* TON */:
      return buildTonTx(tx);
    case "APT" /* APT */:
      return buildAptTx(tx);
    default:
      throw new Error("Unsupported currency");
  }
}

// src/modules/wallets/utils/get-bound-fetch.ts
var cachedFetch;
function getBoundFetch() {
  if (!cachedFetch) {
    if (typeof globalThis.fetch !== "function") {
      throw new Error("[Ecency][Wallets] - global fetch is not available");
    }
    cachedFetch = globalThis.fetch.bind(globalThis);
  }
  return cachedFetch;
}

// src/modules/wallets/queries/use-hive-keys-query.ts
function useHiveKeysQuery(username) {
  const { data: seed } = useSeedPhrase(username);
  return reactQuery.useQuery({
    queryKey: ["ecenc\u0443-wallets", "hive-keys", username, seed],
    staleTime: Infinity,
    queryFn: async () => {
      if (!seed) {
        throw new Error("[Ecency][Wallets] - no seed to create Hive account");
      }
      const method = await detectHiveKeyDerivation(username, seed).catch(
        () => "bip44"
      );
      const keys = method === "master-password" ? deriveHiveMasterPasswordKeys(username, seed) : deriveHiveKeys(seed);
      return {
        username,
        ...keys
      };
    }
  });
}

// src/modules/assets/utils/parse-asset.ts
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

// src/modules/assets/utils/is-empty-date.ts
function isEmptyDate(s) {
  if (s === void 0) {
    return true;
  }
  return parseInt(s.split("-")[0], 10) < 1980;
}

// src/modules/assets/utils/vests-to-hp.ts
function vestsToHp(vests, hivePerMVests) {
  return vests / 1e6 * hivePerMVests;
}

// src/modules/assets/utils/reward-spk.ts
function rewardSpk(data, sstats) {
  let a = 0, b = 0, c = 0, t = 0, diff = data.head_block - data.spk_block;
  if (!data.spk_block) {
    return 0;
  } else if (diff < 28800) {
    return 0;
  } else {
    t = diff / 28800;
    a = data.gov ? simpleInterest(data.gov, t, sstats.spk_rate_lgov) : 0;
    b = data.pow ? simpleInterest(data.pow, t, sstats.spk_rate_lpow) : 0;
    c = simpleInterest(
      (data.granted.t > 0 ? data.granted.t : 0) + (data.granting.t && data.granting.t > 0 ? data.granting.t : 0),
      t,
      sstats.spk_rate_ldel
    );
    const i = a + b + c;
    if (i) {
      return i;
    } else {
      return 0;
    }
  }
  function simpleInterest(p, t2, r) {
    const amount = p * (1 + r / 365);
    const interest = amount - p;
    return interest * t2;
  }
}

// src/internal/hive-auth.ts
var broadcastHandler = null;
function registerHiveAuthBroadcastHandler(handler) {
  broadcastHandler = handler;
}
function getHiveAuthBroadcastHandler() {
  return broadcastHandler;
}

// src/modules/assets/utils/hive-auth.ts
function registerWalletHiveAuthBroadcast(handler) {
  registerHiveAuthBroadcastHandler(handler);
}
function broadcastWithWalletHiveAuth(username, operations, keyType) {
  const handler = getHiveAuthBroadcastHandler();
  if (!handler) {
    throw new Error("HiveAuth broadcast handler is not registered");
  }
  return handler(username, operations, keyType);
}
function hasWalletHiveAuthBroadcast() {
  return typeof getHiveAuthBroadcastHandler() === "function";
}

// src/modules/assets/hive/queries/get-hive-asset-general-info-query-options.ts
function getHiveAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(sdk.getDynamicPropsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        sdk.getAccountFullQueryOptions(username)
      );
      const dynamicProps = sdk.getQueryClient().getQueryData(
        sdk.getDynamicPropsQueryOptions().queryKey
      );
      const accountData = sdk.getQueryClient().getQueryData(
        sdk.getAccountFullQueryOptions(username).queryKey
      );
      const marketTicker = await sdk.CONFIG.hiveClient.call("condenser_api", "get_ticker", []).catch(() => void 0);
      const marketPrice = Number.parseFloat(marketTicker?.latest ?? "");
      if (!accountData) {
        return {
          name: "HIVE",
          title: "Hive",
          price: Number.isFinite(marketPrice) ? marketPrice : dynamicProps ? dynamicProps.base / dynamicProps.quote : 0,
          accountBalance: 0
        };
      }
      const liquidBalance = parseAsset(accountData.balance).amount;
      const savingsBalance = parseAsset(accountData.savings_balance).amount;
      return {
        name: "HIVE",
        title: "Hive",
        price: Number.isFinite(marketPrice) ? marketPrice : dynamicProps ? dynamicProps.base / dynamicProps.quote : 0,
        accountBalance: liquidBalance + savingsBalance,
        parts: [
          {
            name: "current",
            balance: liquidBalance
          },
          {
            name: "savings",
            balance: savingsBalance
          }
        ]
      };
    }
  });
}
function getAPR(dynamicProps) {
  const initialInflationRate = 9.5;
  const initialBlock = 7e6;
  const decreaseRate = 25e4;
  const decreasePercentPerIncrement = 0.01;
  const headBlock = dynamicProps.headBlock;
  const deltaBlocks = headBlock - initialBlock;
  const decreaseIncrements = deltaBlocks / decreaseRate;
  let currentInflationRate = initialInflationRate - decreaseIncrements * decreasePercentPerIncrement;
  if (currentInflationRate < 0.95) {
    currentInflationRate = 0.95;
  }
  const vestingRewardPercent = dynamicProps.vestingRewardPercent / 1e4;
  const virtualSupply = dynamicProps.virtualSupply;
  const totalVestingFunds = dynamicProps.totalVestingFund;
  return (virtualSupply * currentInflationRate * vestingRewardPercent / totalVestingFunds).toFixed(3);
}
function getHivePowerAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-power", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(sdk.getDynamicPropsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        sdk.getAccountFullQueryOptions(username)
      );
      const dynamicProps = sdk.getQueryClient().getQueryData(
        sdk.getDynamicPropsQueryOptions().queryKey
      );
      const accountData = sdk.getQueryClient().getQueryData(
        sdk.getAccountFullQueryOptions(username).queryKey
      );
      if (!dynamicProps || !accountData) {
        return {
          name: "HP",
          title: "Hive Power",
          price: 0,
          accountBalance: 0
        };
      }
      const marketTicker = await sdk.CONFIG.hiveClient.call("condenser_api", "get_ticker", []).catch(() => void 0);
      const marketPrice = Number.parseFloat(marketTicker?.latest ?? "");
      const price = Number.isFinite(marketPrice) ? marketPrice : dynamicProps.base / dynamicProps.quote;
      const vestingShares = parseAsset(accountData.vesting_shares).amount;
      const delegatedVests = parseAsset(accountData.delegated_vesting_shares).amount;
      const receivedVests = parseAsset(accountData.received_vesting_shares).amount;
      const withdrawRateVests = parseAsset(accountData.vesting_withdraw_rate).amount;
      const remainingToWithdrawVests = Math.max(
        (Number(accountData.to_withdraw) - Number(accountData.withdrawn)) / 1e6,
        0
      );
      const nextWithdrawalVests = !isEmptyDate(accountData.next_vesting_withdrawal) ? Math.min(withdrawRateVests, remainingToWithdrawVests) : 0;
      const hpBalance = +vestsToHp(
        vestingShares,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const outgoingDelegationsHp = +vestsToHp(
        delegatedVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const incomingDelegationsHp = +vestsToHp(
        receivedVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const pendingPowerDownHp = +vestsToHp(
        remainingToWithdrawVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const nextPowerDownHp = +vestsToHp(
        nextWithdrawalVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const totalBalance = Math.max(hpBalance - pendingPowerDownHp, 0);
      const availableHp = Math.max(
        // Owned HP minus the portions already delegated away.
        hpBalance - outgoingDelegationsHp,
        0
      );
      return {
        name: "HP",
        title: "Hive Power",
        price,
        accountBalance: +totalBalance.toFixed(3),
        apr: getAPR(dynamicProps),
        parts: [
          {
            name: "hp_balance",
            balance: hpBalance
          },
          {
            name: "available",
            balance: +availableHp.toFixed(3)
          },
          {
            name: "outgoing_delegations",
            balance: outgoingDelegationsHp
          },
          {
            name: "incoming_delegations",
            balance: incomingDelegationsHp
          },
          ...pendingPowerDownHp > 0 ? [
            {
              name: "pending_power_down",
              balance: +pendingPowerDownHp.toFixed(3)
            }
          ] : [],
          ...nextPowerDownHp > 0 && nextPowerDownHp !== pendingPowerDownHp ? [
            {
              name: "next_power_down",
              balance: +nextPowerDownHp.toFixed(3)
            }
          ] : []
        ]
      };
    }
  });
}
function getHbdAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hbd", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(sdk.getDynamicPropsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        sdk.getAccountFullQueryOptions(username)
      );
      const accountData = sdk.getQueryClient().getQueryData(
        sdk.getAccountFullQueryOptions(username).queryKey
      );
      const dynamicProps = sdk.getQueryClient().getQueryData(
        sdk.getDynamicPropsQueryOptions().queryKey
      );
      let price = 1;
      try {
        await sdk.CONFIG.queryClient.prefetchQuery(
          getTokenPriceQueryOptions("HBD")
        );
        const marketPrice = sdk.CONFIG.queryClient.getQueryData(
          getTokenPriceQueryOptions("HBD").queryKey
        ) ?? 0;
        if (typeof marketPrice === "number" && Number.isFinite(marketPrice)) {
          price = marketPrice;
        }
      } catch {
      }
      if (!accountData) {
        return {
          name: "HBD",
          title: "Hive Dollar",
          price,
          accountBalance: 0
        };
      }
      return {
        name: "HBD",
        title: "Hive Dollar",
        price,
        accountBalance: parseAsset(accountData.hbd_balance).amount + parseAsset(accountData?.savings_hbd_balance).amount,
        apr: ((dynamicProps?.hbdInterestRate ?? 0) / 100).toFixed(3),
        parts: [
          {
            name: "current",
            balance: parseAsset(accountData.hbd_balance).amount
          },
          {
            name: "savings",
            balance: parseAsset(accountData.savings_hbd_balance).amount
          }
        ]
      };
    }
  });
}
var ops = dhive.utils.operationOrders;
var HIVE_ACCOUNT_OPERATION_GROUPS = {
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
  ],
  "": []
};
var HIVE_OPERATION_LIST = Object.keys(
  dhive.utils.operationOrders
);
var operationOrders = dhive.utils.operationOrders;
var HIVE_OPERATION_ORDERS = operationOrders;
var HIVE_OPERATION_NAME_BY_ID = Object.entries(operationOrders).reduce((acc, [name, id]) => {
  acc[id] = name;
  return acc;
}, {});

// src/modules/assets/hive/queries/get-hive-asset-transactions-query-options.ts
var operationOrders2 = dhive.utils.operationOrders;
function isHiveOperationName(value) {
  return Object.prototype.hasOwnProperty.call(operationOrders2, value);
}
function resolveHiveOperationFilters(filters) {
  const rawValues = Array.isArray(filters) ? filters : [filters];
  const hasAll = rawValues.includes("");
  const uniqueValues = Array.from(
    new Set(
      rawValues.filter(
        (value) => value !== void 0 && value !== null && value !== ""
      )
    )
  );
  const filterKey = hasAll || uniqueValues.length === 0 ? "all" : uniqueValues.map((value) => value.toString()).sort().join("|");
  const operationIds = /* @__PURE__ */ new Set();
  if (!hasAll) {
    uniqueValues.forEach((value) => {
      if (value in HIVE_ACCOUNT_OPERATION_GROUPS) {
        HIVE_ACCOUNT_OPERATION_GROUPS[value].forEach(
          (id) => operationIds.add(id)
        );
        return;
      }
      if (isHiveOperationName(value)) {
        operationIds.add(operationOrders2[value]);
      }
    });
  }
  const filterArgs = makeBitMaskFilter(Array.from(operationIds));
  return {
    filterKey,
    filterArgs
  };
}
function makeBitMaskFilter(allowedOperations) {
  let low = 0n;
  let high = 0n;
  allowedOperations.forEach((operation) => {
    if (operation < 64) {
      low |= 1n << BigInt(operation);
    } else {
      high |= 1n << BigInt(operation - 64);
    }
  });
  return [low !== 0n ? low.toString() : null, high !== 0n ? high.toString() : null];
}
function getHiveAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterArgs, filterKey } = resolveHiveOperationFilters(filters);
  return reactQuery.infiniteQueryOptions({
    queryKey: ["assets", "hive", "transactions", username, limit, filterKey],
    initialData: { pages: [], pageParams: [] },
    initialPageParam: -1,
    getNextPageParam: (lastPage, __) => lastPage ? +(lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1,
    queryFn: async ({ pageParam }) => {
      const response = await sdk.CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_history",
        [username, pageParam, limit, ...filterArgs]
      );
      return response.map(
        (x) => ({
          num: x[0],
          type: x[1].op[0],
          timestamp: x[1].timestamp,
          trx_id: x[1].trx_id,
          ...x[1].op[1]
        })
      );
    },
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map(
        (page) => page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const hivePayout = parseAsset(item.hive_payout);
              return hivePayout.amount > 0;
            case "transfer":
            case "transfer_to_savings":
            case "transfer_to_vesting":
            case "recurrent_transfer":
              return parseAsset(item.amount).symbol === "HIVE";
            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HIVE"].includes(asset.symbol);
            case "claim_reward_balance":
              const rewardHive = parseAsset(
                item.reward_hive
              );
              return rewardHive.amount > 0;
            case "cancel_transfer_from_savings":
            case "fill_order":
            case "limit_order_create":
            case "limit_order_cancel":
            case "interest":
            case "fill_convert_request":
            case "fill_collateralized_convert_request":
            case "proposal_pay":
            case "update_proposal_votes":
            case "comment_payout_update":
            case "collateralized_convert":
            case "account_witness_proxy":
              return true;
            default:
              return false;
          }
        })
      )
    })
  });
}
function getHivePowerAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterKey } = resolveHiveOperationFilters(filters);
  return reactQuery.infiniteQueryOptions({
    ...getHiveAssetTransactionsQueryOptions(username, limit, filters),
    queryKey: [
      "assets",
      "hive-power",
      "transactions",
      username,
      limit,
      filterKey
    ],
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map(
        (page) => page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const vestingPayout = parseAsset(
                item.vesting_payout
              );
              return vestingPayout.amount > 0;
            case "claim_reward_balance":
              const rewardVests = parseAsset(
                item.reward_vests
              );
              return rewardVests.amount > 0;
            case "transfer_to_vesting":
              return true;
            case "transfer":
            case "transfer_to_savings":
            case "recurrent_transfer":
              return ["VESTS", "HP"].includes(
                parseAsset(item.amount).symbol
              );
            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["VESTS", "HP"].includes(asset.symbol);
            case "curation_reward":
            case "withdraw_vesting":
            case "delegate_vesting_shares":
            case "fill_vesting_withdraw":
            case "return_vesting_delegation":
            case "producer_reward":
            case "set_withdraw_vesting_route":
              return true;
            default:
              return false;
          }
        })
      )
    })
  });
}
function getHbdAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterKey } = resolveHiveOperationFilters(filters);
  return reactQuery.infiniteQueryOptions({
    ...getHiveAssetTransactionsQueryOptions(username, limit, filters),
    queryKey: ["assets", "hbd", "transactions", username, limit, filterKey],
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map(
        (page) => page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const hbdPayout = parseAsset(item.hbd_payout);
              return hbdPayout.amount > 0;
            case "claim_reward_balance":
              const rewardHbd = parseAsset(
                item.reward_hbd
              );
              return rewardHbd.amount > 0;
            case "transfer":
            case "transfer_to_savings":
            case "transfer_to_vesting":
            case "recurrent_transfer":
              return parseAsset(item.amount).symbol === "HBD";
            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HBD"].includes(asset.symbol);
            case "comment_reward":
            case "effective_comment_vote":
              return true;
            default:
              return false;
          }
        })
      )
    })
  });
}
function getHiveAssetMetricQueryOptions(bucketSeconds = 86400) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["assets", "hive", "metrics", bucketSeconds],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData = await sdk.CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [
          bucketSeconds,
          dayjs__default.default(startDate).format("YYYY-MM-DDTHH:mm:ss"),
          dayjs__default.default(endDate).format("YYYY-MM-DDTHH:mm:ss")
        ]
      );
      return apiData.map(({ hive, non_hive, open }) => ({
        close: non_hive.close / hive.close,
        open: non_hive.open / hive.open,
        low: non_hive.low / hive.low,
        high: non_hive.high / hive.high,
        volume: hive.volume,
        time: new Date(open)
      }));
    },
    initialPageParam: [
      // Fetch at least 8 hours or given interval
      dayjs__default.default().subtract(Math.max(100 * bucketSeconds, 28800), "second").toDate(),
      /* @__PURE__ */ new Date()
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      dayjs__default.default(prevStartDate.getTime()).subtract(Math.max(100 * bucketSeconds, 28800), "second").toDate(),
      dayjs__default.default(prevStartDate.getTime()).subtract(bucketSeconds, "second").toDate()
    ]
  });
}
function getHiveAssetWithdrawalRoutesQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () => sdk.CONFIG.hiveClient.database.call("get_withdraw_routes", [
      username,
      "outgoing"
    ])
  });
}
function getHivePowerDelegatesInfiniteQueryOptions(username, limit = 50) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-power", "delegates", username],
    enabled: !!username,
    queryFn: () => sdk.CONFIG.hiveClient.database.call("get_vesting_delegations", [
      username,
      "",
      limit
    ])
  });
}
function getHivePowerDelegatingsQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-power", "delegatings", username],
    queryFn: async () => {
      const response = await fetch(
        sdk.CONFIG.privateApiHost + `/private-api/received-vesting/${username}`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      return (await response.json()).list;
    },
    select: (data) => data.sort(
      (a, b) => parseAsset(b.vesting_shares).amount - parseAsset(a.vesting_shares).amount
    )
  });
}
async function transferHive(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const token = parsedAsset.symbol;
  const precision = token === "VESTS" /* VESTS */ ? 6 : 3;
  const formattedAmount = parsedAsset.amount.toFixed(precision);
  const amountWithSymbol = `${formattedAmount} ${token}`;
  const operation = [
    "transfer",
    {
      from: payload.from,
      to: payload.to,
      amount: amountWithSymbol,
      memo: payload.memo
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return sdk.CONFIG.hiveClient.broadcast.transfer(
      {
        from: params.from,
        to: params.to,
        amount: amountWithSymbol,
        memo: params.memo
      },
      key
    );
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestTransfer(
        payload.from,
        payload.to,
        formattedAmount,
        payload.memo,
        token,
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        },
        true,
        null
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function transferToSavingsHive(payload) {
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo
  };
  const operation = ["transfer_to_savings", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_savings", params]],
      key
    );
  } else if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function transferFromSavingsHive(payload) {
  const requestId = payload.request_id ?? Date.now() >>> 0;
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
    request_id: requestId
  };
  const operation = ["transfer_from_savings", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  }
  if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, [operation], "Active");
  }
  if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  }
  return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
  });
}
async function powerUpHive(payload) {
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo
  };
  const operation = ["transfer_to_vesting", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_vesting", params]],
      key
    );
  } else if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function delegateHive(payload) {
  const operationPayload = {
    delegator: payload.from,
    delegatee: payload.to,
    vesting_shares: payload.amount
  };
  const operation = ["delegate_vesting_shares", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function powerDownHive(payload) {
  const operationPayload = {
    account: payload.from,
    vesting_shares: payload.amount
  };
  const operation = ["withdraw_vesting", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function withdrawVestingRouteHive(payload) {
  const baseParams = {
    from_account: payload.from_account,
    to_account: payload.to_account,
    percent: payload.percent,
    auto_vest: payload.auto_vest
  };
  const operation = ["set_withdraw_vesting_route", baseParams];
  if (payload.type === "key" && "key" in payload) {
    const { key, type: type2, ...params2 } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(
      [["set_withdraw_vesting_route", params2]],
      key
    );
  }
  if (payload.type === "keychain") {
    const { type: type2, ...params2 } = payload;
    return sdk.Keychain.broadcast(params2.from_account, [operation], "Active");
  }
  if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from_account, [operation], "active");
  }
  const { type, ...params } = payload;
  return hs__default.default.sendOperation(operation, { callback: `https://ecency.com/@${params.from_account}/wallet` }, () => {
  });
}
function useClaimRewards(username, onSuccess) {
  const { data } = reactQuery.useQuery(sdk.getAccountFullQueryOptions(username));
  const queryClient = reactQuery.useQueryClient();
  return sdk.useBroadcastMutation(
    ["assets", "hive", "claim-rewards", data?.name],
    username,
    () => {
      if (!data) {
        throw new Error("Failed to fetch account while claiming balance");
      }
      const {
        reward_hive_balance: hiveBalance,
        reward_hbd_balance: hbdBalance,
        reward_vesting_balance: vestingBalance
      } = data;
      return [
        [
          "claim_reward_balance",
          {
            account: username,
            reward_hive: hiveBalance,
            reward_hbd: hbdBalance,
            reward_vests: vestingBalance
          }
        ]
      ];
    },
    async () => {
      onSuccess();
      await delay(1e3);
      queryClient.invalidateQueries({
        queryKey: sdk.getAccountFullQueryOptions(username).queryKey
      });
      queryClient.invalidateQueries({
        queryKey: getHivePowerAssetGeneralInfoQueryOptions(username).queryKey
      });
    }
  );
}
async function claimInterestHive(payload) {
  const requestId = payload.request_id ?? Date.now() >>> 0;
  const baseOperation = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
    request_id: requestId
  };
  const cancelOperation = {
    from: payload.from,
    request_id: requestId
  };
  const operations = [
    ["transfer_from_savings", baseOperation],
    ["cancel_transfer_from_savings", cancelOperation]
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(operations, key);
  }
  if (payload.type === "keychain") {
    return sdk.Keychain.broadcast(payload.from, operations, "Active");
  }
  if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, operations, "active");
  }
  return hs__default.default.sendOperations(operations, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
  });
}

// src/modules/assets/types/asset-operation.ts
var AssetOperation = /* @__PURE__ */ ((AssetOperation2) => {
  AssetOperation2["Transfer"] = "transfer";
  AssetOperation2["TransferToSavings"] = "transfer-saving";
  AssetOperation2["WithdrawFromSavings"] = "withdraw-saving";
  AssetOperation2["Delegate"] = "delegate";
  AssetOperation2["PowerUp"] = "power-up";
  AssetOperation2["PowerDown"] = "power-down";
  AssetOperation2["WithdrawRoutes"] = "withdraw-routes";
  AssetOperation2["ClaimInterest"] = "claim-interest";
  AssetOperation2["Swap"] = "swap";
  AssetOperation2["Gift"] = "gift";
  AssetOperation2["Promote"] = "promote";
  AssetOperation2["Claim"] = "claim";
  AssetOperation2["Buy"] = "buy";
  AssetOperation2["LockLiquidity"] = "lock";
  AssetOperation2["Stake"] = "stake";
  AssetOperation2["Unstake"] = "unstake";
  AssetOperation2["Undelegate"] = "undelegate";
  return AssetOperation2;
})(AssetOperation || {});
async function transferSpk(payload) {
  const json = JSON.stringify({
    to: payload.to,
    amount: parseAsset(payload.amount).amount * 1e3,
    ...typeof payload.memo === "string" ? { memo: payload.memo } : {}
  });
  const op = {
    id: "spkcc_spk_send",
    json,
    required_auths: [payload.from],
    required_posting_auths: []
  };
  const operation = [
    "custom_json",
    {
      id: op.id,
      required_auths: [payload.from],
      required_posting_auths: [],
      json
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return sdk.Keychain.customJson(
      payload.from,
      "spkcc_spk_send",
      "Active",
      json,
      payload.to
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs__default.default.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: "spkcc_spk_send",
        json: JSON.stringify({
          to: payload.to,
          amount: +amount * 1e3,
          ...typeof payload.memo === "string" ? { memo: payload.memo } : {}
        })
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
}
var lockLarynx = async (payload) => {
  const json = JSON.stringify({ amount: +payload.amount * 1e3 });
  const op = {
    id: payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down",
    json,
    required_auths: [payload.from],
    required_posting_auths: []
  };
  const operation = [
    "custom_json",
    {
      id: op.id,
      required_auths: [payload.from],
      required_posting_auths: [],
      json
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return sdk.Keychain.customJson(
      payload.from,
      op.id,
      "Active",
      json,
      payload.from
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs__default.default.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: op.id,
        json: JSON.stringify({ amount: +amount * 1e3 })
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
};
async function powerUpLarynx(payload) {
  const json = JSON.stringify({ amount: +payload.amount * 1e3 });
  const op = {
    id: `spkcc_power_${payload.mode}`,
    json,
    required_auths: [payload.from],
    required_posting_auths: []
  };
  const operation = [
    "custom_json",
    {
      id: `spkcc_power_${payload.mode}`,
      required_auths: [payload.from],
      required_posting_auths: [],
      json
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return sdk.Keychain.customJson(
      payload.from,
      `spkcc_power_${payload.mode}`,
      "Active",
      json,
      ""
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs__default.default.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: `spkcc_power_${payload.mode}`,
        json: JSON.stringify({ amount: +amount * 1e3 })
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
}
async function transferLarynx(payload) {
  const json = JSON.stringify({
    to: payload.to,
    amount: parseAsset(payload.amount).amount * 1e3,
    ...typeof payload.memo === "string" ? { memo: payload.memo } : {}
  });
  const op = {
    id: "spkcc_send",
    json,
    required_auths: [payload.from],
    required_posting_auths: []
  };
  const operation = [
    "custom_json",
    {
      id: "spkcc_send",
      required_auths: [payload.from],
      required_posting_auths: [],
      json
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return sdk.Keychain.customJson(
      payload.from,
      "spkcc_send",
      "Active",
      json,
      payload.to
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs__default.default.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: "spkcc_send",
        json: JSON.stringify({
          to: payload.to,
          amount: +amount * 1e3,
          ...typeof payload.memo === "string" ? { memo: payload.memo } : {}
        })
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
}
function getSpkMarketsQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["assets", "spk", "markets"],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const response = await fetch(`${sdk.CONFIG.spkNode}/markets`);
      const data = await response.json();
      return {
        list: Object.entries(data.markets.node).map(([name, node]) => ({
          name,
          status: node.lastGood >= data.head_block - 1200 ? "\u{1F7E9}" : node.lastGood > data.head_block - 28800 ? "\u{1F7E8}" : "\u{1F7E5}"
        })),
        raw: data
      };
    }
  });
}
function getSpkWalletQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      const response = await fetch(sdk.CONFIG.spkNode + `/@${username}`);
      return response.json();
    },
    enabled: !!username,
    staleTime: 6e4,
    refetchInterval: 9e4
  });
}

// src/modules/assets/spk/queries/get-larynx-asset-general-info-query-options.ts
function format(value) {
  return value.toFixed(3);
}
function getLarynxAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "larynx", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await sdk.getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = sdk.getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = sdk.getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = sdk.getQueryClient().getQueryData(
        getHiveAssetGeneralInfoQueryOptions(username).queryKey
      );
      if (!wallet || !market) {
        return {
          name: "LARYNX",
          title: "SPK Network / LARYNX",
          price: 1,
          accountBalance: 0
        };
      }
      const price = +format(
        wallet.balance / 1e3 * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format(wallet.balance / 1e3);
      return {
        name: "LARYNX",
        layer: "SPK",
        title: "LARYNX",
        price: price / accountBalance,
        accountBalance
      };
    }
  });
}
function format2(value) {
  return value.toFixed(3);
}
function getSpkAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "spk", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await sdk.getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = sdk.getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = sdk.getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = sdk.getQueryClient().getQueryData(
        getHiveAssetGeneralInfoQueryOptions(username).queryKey
      );
      if (!wallet || !market) {
        return {
          name: "SPK",
          layer: "SPK",
          title: "SPK Network",
          price: 1,
          accountBalance: 0
        };
      }
      const price = +format2(
        (wallet.gov + wallet.spk) / 1e3 * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format2(
        (wallet.spk + rewardSpk(
          wallet,
          market.raw.stats || {
            spk_rate_lgov: "0.001",
            spk_rate_lpow: format2(
              parseFloat(market.raw.stats.spk_rate_lpow) * 100
            ),
            spk_rate_ldel: format2(
              parseFloat(market.raw.stats.spk_rate_ldel) * 100
            )
          }
        )) / 1e3
      );
      return {
        name: "SPK",
        layer: "SPK",
        title: "SPK Network",
        price: price / accountBalance,
        accountBalance
      };
    }
  });
}
function format3(value) {
  return value.toFixed(3);
}
function getLarynxPowerAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "larynx-power", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await sdk.getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await sdk.getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = sdk.getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = sdk.getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = sdk.getQueryClient().getQueryData(
        getHiveAssetGeneralInfoQueryOptions(username).queryKey
      );
      if (!wallet || !market) {
        return {
          name: "LP",
          title: "SPK Network / LARYNX Power",
          price: 1,
          accountBalance: 0
        };
      }
      const price = +format3(
        wallet.poweredUp / 1e3 * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format3(wallet.poweredUp / 1e3);
      return {
        name: "LP",
        title: "LARYNX Power",
        layer: "SPK",
        price: price / accountBalance,
        accountBalance,
        parts: [
          {
            name: "delegating",
            balance: wallet.granting?.t ? +format3(wallet.granting.t / 1e3) : 0
          },
          {
            name: "recieved",
            balance: wallet.granted?.t ? +format3(wallet.granted.t / 1e3) : 0
          }
        ]
      };
    }
  });
}
function getHiveEngineTokensMetadataQueryOptions(tokens) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "metadata-list", tokens],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const response = await fetch(
        `${sdk.CONFIG.privateApiHost}/private-api/engine-api`,
        {
          method: "POST",
          body: JSON.stringify({
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
          }),
          headers: { "Content-type": "application/json" }
        }
      );
      const data = await response.json();
      return data.result;
    }
  });
}
function getHiveEngineTokensBalancesQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "balances", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const response = await fetch(
        `${sdk.CONFIG.privateApiHost}/private-api/engine-api`,
        {
          method: "POST",
          body: JSON.stringify({
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
          }),
          headers: { "Content-type": "application/json" }
        }
      );
      const data = await response.json();
      return data.result;
    }
  });
}
function getHiveEngineTokensMarketQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "markets"],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const response = await fetch(
        `${sdk.CONFIG.privateApiHost}/private-api/engine-api`,
        {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "find",
            params: {
              contract: "market",
              table: "metrics",
              query: {}
            },
            id: 1
          }),
          headers: { "Content-type": "application/json" }
        }
      );
      const data = await response.json();
      return data.result;
    }
  });
}

// src/modules/assets/hive-engine/queries/get-hive-engine-token-general-info-query-options.ts
function getHiveEngineTokenGeneralInfoQueryOptions(username, symbol) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", symbol, "general-info", username],
    enabled: !!symbol && !!username,
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      if (!symbol || !username) {
        throw new Error(
          "[SDK][Wallets] \u2013 hive engine token or username missed"
        );
      }
      const queryClient = sdk.getQueryClient();
      const hiveQuery = getHiveAssetGeneralInfoQueryOptions(username);
      await queryClient.prefetchQuery(hiveQuery);
      const hiveData = queryClient.getQueryData(
        hiveQuery.queryKey
      );
      const metadataList = await queryClient.ensureQueryData(
        getHiveEngineTokensMetadataQueryOptions([symbol])
      );
      const balanceList = await queryClient.ensureQueryData(
        getHiveEngineTokensBalancesQueryOptions(username)
      );
      const marketList = await queryClient.ensureQueryData(
        getHiveEngineTokensMarketQueryOptions()
      );
      const metadata = metadataList?.find((i) => i.symbol === symbol);
      const balance = balanceList?.find((i) => i.symbol === symbol);
      const market = marketList?.find((i) => i.symbol === symbol);
      const lastPrice = +(market?.lastPrice ?? "0");
      const liquidBalance = parseFloat(balance?.balance ?? "0");
      const stakedBalance = parseFloat(balance?.stake ?? "0");
      const unstakingBalance = parseFloat(balance?.pendingUnstake ?? "0");
      const parts = [
        { name: "liquid", balance: liquidBalance },
        { name: "staked", balance: stakedBalance }
      ];
      if (unstakingBalance > 0) {
        parts.push({ name: "unstaking", balance: unstakingBalance });
      }
      return {
        name: symbol,
        title: metadata?.name ?? "",
        price: lastPrice === 0 ? 0 : Number(lastPrice * (hiveData?.price ?? 0)),
        accountBalance: liquidBalance + stakedBalance,
        layer: "ENGINE",
        parts
      };
    }
  });
}
function getHiveEngineTokenTransactionsQueryOptions(username, symbol, limit = 20) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["assets", "hive-engine", symbol, "transactions", username],
    enabled: !!symbol && !!username,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.length ?? 0) + limit,
    queryFn: async ({ pageParam }) => {
      if (!symbol || !username) {
        throw new Error(
          "[SDK][Wallets] \u2013 hive engine token or username missed"
        );
      }
      const url = new URL(
        `${sdk.CONFIG.privateApiHost}/private-api/engine-account-history`
      );
      url.searchParams.set("account", username);
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("offset", pageParam.toString());
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-type": "application/json" }
      });
      return await response.json();
    }
  });
}
function getHiveEngineTokensMetricsQueryOptions(symbol, interval = "daily") {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", symbol],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const url = new URL(
        `${sdk.CONFIG.privateApiHost}/private-api/engine-chart-api`
      );
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("interval", interval);
      const response = await fetch(url, {
        headers: { "Content-type": "application/json" }
      });
      return await response.json();
    }
  });
}
async function delegateEngineToken(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();
  const operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "delegate",
        contractPayload: {
          symbol: payload.asset,
          to: payload.to,
          quantity
        }
      })
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "delegate",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity
        }
      }),
      required_auths: [params.from],
      required_posting_auths: []
    };
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        operation[1].json,
        "Token Delegation",
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        }
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function undelegateEngineToken(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();
  const operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "undelegate",
        contractPayload: {
          symbol: payload.asset,
          from: payload.to,
          quantity
        }
      })
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "undelegate",
        contractPayload: {
          symbol: params.asset,
          from: params.to,
          quantity
        }
      }),
      required_auths: [params.from],
      required_posting_auths: []
    };
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        operation[1].json,
        "Token Undelegation",
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        }
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function stakeEngineToken(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();
  const operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "stake",
        contractPayload: {
          symbol: payload.asset,
          to: payload.to,
          quantity
        }
      })
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "stake",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity
        }
      }),
      required_auths: [params.from],
      required_posting_auths: []
    };
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        operation[1].json,
        "Token Staking",
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        }
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function unstakeEngineToken(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();
  const operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "unstake",
        contractPayload: {
          symbol: payload.asset,
          to: payload.to,
          quantity
        }
      })
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "unstake",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity
        }
      }),
      required_auths: [params.from],
      required_posting_auths: []
    };
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        operation[1].json,
        "Token Unstaking",
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        }
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function transferEngineToken(payload) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();
  const operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: payload.asset,
          to: payload.to,
          quantity,
          memo: payload.memo
        }
      })
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity,
          memo: params.memo
        }
      }),
      required_auths: [params.from],
      required_posting_auths: []
    };
    return sdk.CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise(
      (resolve, reject) => window.hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        operation[1].json,
        "Token Transfer",
        (resp) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }
          resolve(resp);
        }
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs__default.default.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
function getPointsQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "points", username],
    queryFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Query] \u2013 username wasn`t provided"
        );
      }
      const response = await fetch(
        sdk.CONFIG.privateApiHost + "/private-api/points",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username })
        }
      );
      const points = await response.json();
      return {
        points: points.points,
        uPoints: points.unclaimed_points
      };
    },
    staleTime: 6e4,
    refetchInterval: 9e4,
    refetchOnMount: true,
    enabled: !!username
  });
}
function getPointsAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "points", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await sdk.getQueryClient().prefetchQuery(getPointsQueryOptions(username));
      const data = sdk.getQueryClient().getQueryData(
        getPointsQueryOptions(username).queryKey
      );
      return {
        name: "POINTS",
        title: "Ecency Points",
        price: 2e-3,
        accountBalance: +data?.points
      };
    }
  });
}
function getPointsAssetTransactionsQueryOptions(username, type) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "points", "transactions", username, type],
    queryFn: async () => {
      const response = await fetch(
        `${sdk.CONFIG.privateApiHost}/private-api/point-list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            type: type ?? 0
          })
        }
      );
      const data = await response.json();
      return data.map(({ created, type: type2, amount, id, sender, receiver, memo }) => ({
        created: new Date(created),
        type: type2,
        results: [
          {
            amount: parseFloat(amount),
            asset: "POINTS"
          }
        ],
        id,
        from: sender ?? void 0,
        to: receiver ?? void 0,
        memo: memo ?? void 0
      }));
    }
  });
}

// src/modules/assets/points/mutations/claim-points.ts
function useClaimPoints(username, onSuccess, onError) {
  const { mutateAsync: recordActivity } = sdk.EcencyAnalytics.useRecordActivity(
    username,
    "points-claimed"
  );
  const fetchApi = getBoundFetch();
  return reactQuery.useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Claim] \u2013 username wasn`t provided"
        );
      }
      return fetchApi(sdk.CONFIG.privateApiHost + "/private-api/points-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: sdk.getAccessToken(username) })
      });
    },
    onError,
    onSuccess: () => {
      recordActivity();
      sdk.CONFIG.queryClient.setQueryData(
        getPointsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }
          return {
            points: (parseFloat(data.points) + parseFloat(data.uPoints)).toFixed(3),
            uPoints: "0"
          };
        }
      );
      onSuccess?.();
    }
  });
}
async function transferPoint({
  from,
  to,
  amount,
  memo,
  type,
  ...payload
}) {
  const op = [
    "custom_json",
    {
      id: "ecency_point_transfer",
      json: JSON.stringify({
        sender: from,
        receiver: to,
        amount: amount.replace("POINTS", "POINT"),
        memo
      }),
      required_auths: [from],
      required_posting_auths: []
    }
  ];
  if (type === "key" && "key" in payload) {
    const { key } = payload;
    return sdk.CONFIG.hiveClient.broadcast.sendOperations([op], key);
  }
  if (type === "keychain") {
    return sdk.Keychain.broadcast(from, [op], "Active");
  }
  if (type === "hiveauth") {
    return broadcastWithWalletHiveAuth(from, [op], "active");
  }
  return hs__default.default.sendOperation(op, { callback: `https://ecency.com/@${from}/wallet` }, () => {
  });
}

// src/modules/assets/points/types/point-transaction-type.ts
var PointTransactionType = /* @__PURE__ */ ((PointTransactionType2) => {
  PointTransactionType2[PointTransactionType2["CHECKIN"] = 10] = "CHECKIN";
  PointTransactionType2[PointTransactionType2["LOGIN"] = 20] = "LOGIN";
  PointTransactionType2[PointTransactionType2["CHECKIN_EXTRA"] = 30] = "CHECKIN_EXTRA";
  PointTransactionType2[PointTransactionType2["POST"] = 100] = "POST";
  PointTransactionType2[PointTransactionType2["COMMENT"] = 110] = "COMMENT";
  PointTransactionType2[PointTransactionType2["VOTE"] = 120] = "VOTE";
  PointTransactionType2[PointTransactionType2["REBLOG"] = 130] = "REBLOG";
  PointTransactionType2[PointTransactionType2["DELEGATION"] = 150] = "DELEGATION";
  PointTransactionType2[PointTransactionType2["REFERRAL"] = 160] = "REFERRAL";
  PointTransactionType2[PointTransactionType2["COMMUNITY"] = 170] = "COMMUNITY";
  PointTransactionType2[PointTransactionType2["TRANSFER_SENT"] = 998] = "TRANSFER_SENT";
  PointTransactionType2[PointTransactionType2["TRANSFER_INCOMING"] = 999] = "TRANSFER_INCOMING";
  PointTransactionType2[PointTransactionType2["MINTED"] = 991] = "MINTED";
  return PointTransactionType2;
})(PointTransactionType || {});
function createFallbackTokenMetadata(symbol) {
  return {
    issuer: "",
    symbol,
    name: symbol,
    metadata: "{}",
    precision: 0,
    maxSupply: "0",
    supply: "0",
    circulatingSupply: "0",
    stakingEnabled: false,
    unstakingCooldown: 0,
    delegationEnabled: false,
    undelegationCooldown: 0,
    numberTransactions: 0,
    totalStaked: "0"
  };
}
async function getLayer2TokensMetadata(username) {
  if (!username) {
    return [];
  }
  let balances = [];
  try {
    balances = await sdk.getQueryClient().fetchQuery(
      getHiveEngineTokensBalancesQueryOptions(username)
    );
  } catch {
    balances = [];
  }
  const uniqueSymbols = Array.from(
    new Set(
      balances.map((balance) => balance.symbol).filter((symbol) => Boolean(symbol))
    )
  );
  if (uniqueSymbols.length === 0) {
    return [];
  }
  let metadataList = [];
  try {
    metadataList = await sdk.getQueryClient().fetchQuery(
      getHiveEngineTokensMetadataQueryOptions(uniqueSymbols)
    );
  } catch {
    metadataList = [];
  }
  const metadataBySymbol = new Map(
    metadataList.map((token) => [token.symbol, token])
  );
  return uniqueSymbols.map(
    (symbol) => metadataBySymbol.get(symbol) ?? createFallbackTokenMetadata(symbol)
  );
}
function getAllTokensListQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "all-tokens-list", username ?? null],
    queryFn: async () => {
      return {
        basic: [
          "POINTS" /* Points */,
          "HIVE" /* Hive */,
          "HP" /* HivePower */,
          "HBD" /* HiveDollar */
        ],
        external: Object.values(EcencyWalletCurrency),
        spk: ["SPK", "LARYNX", "LP"],
        layer2: await getLayer2TokensMetadata(username)
      };
    }
  });
}
var ACTION_ALIAS_MAP = {
  "transfer-to-savings": "transfer-saving" /* TransferToSavings */,
  "transfer-savings": "transfer-saving" /* TransferToSavings */,
  "savings-transfer": "transfer-saving" /* TransferToSavings */,
  "withdraw-from-savings": "withdraw-saving" /* WithdrawFromSavings */,
  "withdraw-savings": "withdraw-saving" /* WithdrawFromSavings */,
  "savings-withdraw": "withdraw-saving" /* WithdrawFromSavings */,
  "powerup": "power-up" /* PowerUp */,
  "power-down": "power-down" /* PowerDown */,
  "powerdown": "power-down" /* PowerDown */,
  "hp-delegate": "delegate" /* Delegate */,
  "delegate-hp": "delegate" /* Delegate */,
  "delegate-power": "delegate" /* Delegate */,
  "undelegate-power": "undelegate" /* Undelegate */,
  "undelegate-token": "undelegate" /* Undelegate */,
  "stake-token": "stake" /* Stake */,
  "stake-power": "stake" /* Stake */,
  "unstake-token": "unstake" /* Unstake */,
  "unstake-power": "unstake" /* Unstake */,
  "lock-liquidity": "lock" /* LockLiquidity */,
  "lock-liq": "lock" /* LockLiquidity */,
  "gift-points": "gift" /* Gift */,
  "points-gift": "gift" /* Gift */,
  "promote-post": "promote" /* Promote */,
  "promote-entry": "promote" /* Promote */,
  "claim-points": "claim" /* Claim */,
  "claim-rewards": "claim" /* Claim */,
  "buy-points": "buy" /* Buy */,
  "swap-token": "swap" /* Swap */,
  "swap-tokens": "swap" /* Swap */,
  "withdraw-routes": "withdraw-routes" /* WithdrawRoutes */,
  "withdrawroutes": "withdraw-routes" /* WithdrawRoutes */,
  "claim-interest": "claim-interest" /* ClaimInterest */
};
var KNOWN_OPERATION_VALUES = new Map(
  Object.values(AssetOperation).map((value) => [value, value])
);
var DERIVED_PART_KEY_MAP = {
  liquid: ["liquid", "liquidBalance", "liquid_amount", "liquidTokens"],
  savings: ["savings", "savingsBalance", "savings_amount"],
  staked: ["staked", "stakedBalance", "staking", "stake", "power"],
  delegated: ["delegated", "delegatedBalance", "delegationsOut"],
  received: ["received", "receivedBalance", "delegationsIn"],
  pending: [
    "pending",
    "pendingRewards",
    "unclaimed",
    "unclaimedBalance",
    "pendingReward"
  ]
};
var EXTRA_DATA_PART_KEY_MAP = {
  delegated: "outgoing_delegations",
  outgoing: "outgoing_delegations",
  delegations_out: "outgoing_delegations",
  delegated_hive_power: "outgoing_delegations",
  delegated_hp: "outgoing_delegations",
  received: "incoming_delegations",
  incoming: "incoming_delegations",
  delegations_in: "incoming_delegations",
  received_hive_power: "incoming_delegations",
  received_hp: "incoming_delegations",
  powering_down: "pending_power_down",
  power_down: "pending_power_down",
  powering_down_hive_power: "pending_power_down"
};
function normalizeString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : void 0;
  }
  return void 0;
}
function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return void 0;
    }
    const direct = Number.parseFloat(trimmed);
    if (Number.isFinite(direct)) {
      return direct;
    }
    const sanitized = trimmed.replace(/,/g, "");
    const match = sanitized.match(/[-+]?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number.parseFloat(match[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return void 0;
}
function normalizeApr(value) {
  const numeric = normalizeNumber(value);
  if (numeric === void 0) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : void 0;
    }
    return void 0;
  }
  return numeric.toString();
}
function normalizeParts(rawParts) {
  if (Array.isArray(rawParts)) {
    const parsed = rawParts.map((item) => {
      if (!item || typeof item !== "object") {
        return void 0;
      }
      const name = normalizeString(
        item.name ?? item.label ?? item.type ?? item.part
      );
      const balance = normalizeNumber(
        item.balance ?? item.amount ?? item.value
      );
      if (!name || balance === void 0) {
        return void 0;
      }
      return { name, balance };
    }).filter((item) => Boolean(item));
    return parsed.length ? parsed : void 0;
  }
  if (rawParts && typeof rawParts === "object") {
    const parsed = Object.entries(rawParts).map(([name, amount]) => {
      const balance = normalizeNumber(amount);
      if (!name || balance === void 0) {
        return void 0;
      }
      return { name, balance };
    }).filter((item) => Boolean(item));
    return parsed.length ? parsed : void 0;
  }
  return void 0;
}
function deriveParts(record) {
  const derived = Object.entries(DERIVED_PART_KEY_MAP).map(([name, keys]) => {
    for (const key of keys) {
      const value = normalizeNumber(record[key]);
      if (value !== void 0) {
        return { name, balance: value };
      }
    }
    return void 0;
  }).filter((item) => Boolean(item));
  return derived.length ? derived : void 0;
}
function normalizePartKey(value) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function mergeParts(...sources) {
  const order = [];
  const values2 = /* @__PURE__ */ new Map();
  for (const parts of sources) {
    if (!parts) {
      continue;
    }
    for (const part of parts) {
      if (!part?.name || typeof part.balance !== "number") {
        continue;
      }
      const existing = values2.get(part.name);
      if (existing === void 0) {
        order.push(part.name);
        values2.set(part.name, part.balance);
      } else {
        values2.set(part.name, existing + part.balance);
      }
    }
  }
  return order.length ? order.map((name) => ({ name, balance: values2.get(name) })) : void 0;
}
function normalizeExtraDataParts(rawExtraData) {
  const items = Array.isArray(rawExtraData) ? rawExtraData : rawExtraData && typeof rawExtraData === "object" ? Object.values(rawExtraData) : [];
  const parts = items.map((item) => {
    if (!item || typeof item !== "object") {
      return void 0;
    }
    const record = item;
    const keyCandidate = normalizeString(record.dataKey) ?? normalizeString(record.key) ?? normalizeString(record.name);
    if (!keyCandidate) {
      return void 0;
    }
    const canonical = normalizePartKey(keyCandidate);
    const partName = EXTRA_DATA_PART_KEY_MAP[canonical];
    if (!partName) {
      return void 0;
    }
    const balance = normalizeNumber(
      record.balance ?? record.amount ?? record.value ?? record.displayValue ?? record.text
    );
    if (balance === void 0) {
      return void 0;
    }
    return { name: partName, balance: Math.abs(balance) };
  }).filter((part) => Boolean(part));
  return parts.length ? parts : void 0;
}
function normalizeActionKey(value) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}
function mapActions(rawActions) {
  if (!rawActions) {
    return [];
  }
  const rawList = Array.isArray(rawActions) ? rawActions : [rawActions];
  const result = [];
  for (const raw of rawList) {
    let candidate;
    if (typeof raw === "string") {
      candidate = raw;
    } else if (raw && typeof raw === "object") {
      const record = raw;
      candidate = normalizeString(record.code) ?? normalizeString(record.name) ?? normalizeString(record.action);
    }
    if (!candidate) {
      continue;
    }
    const canonical = normalizeActionKey(candidate);
    const operation = KNOWN_OPERATION_VALUES.get(canonical) ?? ACTION_ALIAS_MAP[canonical];
    if (operation && !result.includes(operation)) {
      result.push(operation);
    }
  }
  return result;
}
function parseToken(rawToken) {
  if (!rawToken || typeof rawToken !== "object") {
    return void 0;
  }
  const token = rawToken;
  const symbol = normalizeString(token.symbol) ?? normalizeString(token.asset) ?? normalizeString(token.name);
  if (!symbol) {
    return void 0;
  }
  const normalizedSymbol = symbol.toUpperCase();
  const title = normalizeString(token.title) ?? normalizeString(token.display) ?? normalizeString(token.label) ?? normalizeString(token.friendlyName) ?? normalizeString(token.name) ?? normalizedSymbol;
  const price = normalizeNumber(token.fiatRate) ?? normalizeNumber(token.price) ?? normalizeNumber(token.priceUsd) ?? normalizeNumber(token.usdPrice) ?? normalizeNumber(token.metrics?.price) ?? normalizeNumber(
    token.metrics?.priceUsd
  ) ?? 0;
  const apr = normalizeApr(token.apr) ?? normalizeApr(token.aprPercent) ?? normalizeApr(token.metrics?.apr) ?? normalizeApr(
    token.metrics?.aprPercent
  );
  const baseParts = normalizeParts(
    token.parts ?? token.balances ?? token.sections ?? token.breakdown ?? token.accountBreakdown ?? token.walletParts
  ) ?? deriveParts(token);
  const parts = mergeParts(
    baseParts,
    normalizeExtraDataParts(
      token.extraData ?? token.extra_data ?? token.extra ?? token.badges
    )
  );
  const accountBalance = normalizeNumber(token.balance) ?? normalizeNumber(token.accountBalance) ?? normalizeNumber(token.totalBalance) ?? normalizeNumber(token.total) ?? normalizeNumber(token.amount) ?? (baseParts ? baseParts.reduce((total, part) => total + (part.balance ?? 0), 0) : parts ? parts.reduce((total, part) => total + (part.balance ?? 0), 0) : 0);
  const layer = normalizeString(token.layer) ?? normalizeString(token.chain) ?? normalizeString(token.category) ?? normalizeString(token.type);
  return {
    symbol: normalizedSymbol,
    info: {
      name: normalizedSymbol,
      title,
      price,
      accountBalance,
      apr: apr ?? void 0,
      layer: layer ?? void 0,
      parts
    },
    operations: mapActions(
      token.actions ?? token.available_actions ?? token.availableActions ?? token.operations ?? token.supportedActions
    )
  };
}
function extractTokens(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const containers = [payload];
  const record = payload;
  if (record.data && typeof record.data === "object") {
    containers.push(record.data);
  }
  if (record.result && typeof record.result === "object") {
    containers.push(record.result);
  }
  if (record.portfolio && typeof record.portfolio === "object") {
    containers.push(record.portfolio);
  }
  for (const container of containers) {
    if (Array.isArray(container)) {
      return container;
    }
    if (container && typeof container === "object") {
      for (const key of [
        "wallets",
        "tokens",
        "assets",
        "items",
        "portfolio",
        "balances"
      ]) {
        const value = container[key];
        if (Array.isArray(value)) {
          return value;
        }
      }
    }
  }
  return [];
}
function resolveUsername(payload) {
  if (!payload || typeof payload !== "object") {
    return void 0;
  }
  const record = payload;
  return normalizeString(record.username) ?? normalizeString(record.name) ?? normalizeString(record.account);
}
function getVisionPortfolioQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: [
      "ecency-wallets",
      "portfolio",
      "v2",
      username,
      "only-enabled"
    ],
    enabled: Boolean(username),
    staleTime: 6e4,
    refetchInterval: 12e4,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallets] \u2013 username is required");
      }
      if (!sdk.CONFIG.privateApiHost) {
        throw new Error(
          "[SDK][Wallets] \u2013 privateApiHost isn't configured for portfolio"
        );
      }
      const endpoint = `${sdk.CONFIG.privateApiHost}/wallet-api/portfolio-v2`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, onlyEnabled: true })
      });
      if (!response.ok) {
        throw new Error(
          `[SDK][Wallets] \u2013 Vision portfolio request failed(${response.status})`
        );
      }
      const payload = await response.json();
      const tokens = extractTokens(payload).map((item) => parseToken(item)).filter((item) => Boolean(item));
      if (!tokens.length) {
        throw new Error(
          "[SDK][Wallets] \u2013 Vision portfolio payload contained no tokens"
        );
      }
      return {
        username: resolveUsername(payload) ?? username,
        currency: normalizeString(
          payload?.currency
        )?.toUpperCase(),
        wallets: tokens
      };
    }
  });
}

// src/modules/wallets/queries/use-get-account-wallet-list-query.ts
function getAccountWalletListQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "list", username],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username);
      const queryClient = sdk.getQueryClient();
      try {
        const portfolio = await queryClient.fetchQuery(portfolioQuery);
        const tokensFromPortfolio = portfolio.wallets.map(
          (asset) => asset.info.name
        );
        if (tokensFromPortfolio.length > 0) {
          return Array.from(new Set(tokensFromPortfolio));
        }
      } catch {
      }
      const accountQuery = sdk.getAccountFullQueryOptions(username);
      await queryClient.fetchQuery({
        queryKey: accountQuery.queryKey
      });
      const account = queryClient.getQueryData(
        accountQuery.queryKey
      );
      if (account?.profile?.tokens instanceof Array) {
        const list = [
          "POINTS" /* Points */,
          "HIVE" /* Hive */,
          "HP" /* HivePower */,
          "HBD" /* HiveDollar */,
          ...account.profile.tokens.filter(({ meta }) => !!meta?.show).map((token) => token.symbol)
        ];
        return Array.from(new Set(list).values());
      }
      return [
        "POINTS" /* Points */,
        "HIVE" /* Hive */,
        "HP" /* HivePower */,
        "HBD" /* HiveDollar */
      ];
    }
  });
}

// src/modules/assets/external/common/parse-private-api-balance.ts
function normalizeBalance2(balance) {
  if (typeof balance === "number") {
    if (!Number.isFinite(balance)) {
      throw new Error("Private API returned a non-finite numeric balance");
    }
    return Math.trunc(balance).toString();
  }
  if (typeof balance === "string") {
    const trimmed = balance.trim();
    if (trimmed === "") {
      throw new Error("Private API returned an empty balance string");
    }
    return trimmed;
  }
  throw new Error("Private API returned balance in an unexpected format");
}
function parsePrivateApiBalance2(result, expectedChain) {
  if (!result || typeof result !== "object") {
    throw new Error("Private API returned an unexpected response");
  }
  const { chain, balance, unit, raw, nodeId } = result;
  if (typeof chain !== "string" || chain !== expectedChain) {
    throw new Error("Private API response chain did not match request");
  }
  if (typeof unit !== "string" || unit.length === 0) {
    throw new Error("Private API response is missing unit information");
  }
  if (balance === void 0 || balance === null) {
    throw new Error("Private API response is missing balance information");
  }
  const balanceString = normalizeBalance2(balance);
  let balanceBigInt;
  try {
    balanceBigInt = BigInt(balanceString);
  } catch (error) {
    throw new Error("Private API returned a balance that is not an integer");
  }
  return {
    chain,
    unit,
    raw,
    nodeId: typeof nodeId === "string" && nodeId.length > 0 ? nodeId : void 0,
    balanceBigInt,
    balanceString
  };
}

// src/modules/assets/external/apt/get-apt-asset-balance-query-options.ts
function getAptAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "apt", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/apt/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "apt").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "apt").balanceString;
      }
    }
  });
}
async function getAddressFromAccount(username, tokenName) {
  await sdk.CONFIG.queryClient.prefetchQuery(sdk.getAccountFullQueryOptions(username));
  const account = sdk.CONFIG.queryClient.getQueryData(
    sdk.getAccountFullQueryOptions(username).queryKey
  );
  const address = account?.profile?.tokens?.find((t) => t.symbol === tokenName)?.meta?.address;
  if (!address) {
    throw new Error(
      "[SDK][Wallets] \u2013\xA0cannot fetch APT balance with empty adrress"
    );
  }
  return address;
}

// src/modules/assets/external/apt/get-apt-asset-general-info-query-options.ts
function getAptAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "apt", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "APT");
      await sdk.CONFIG.queryClient.fetchQuery(
        getAptAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getAptAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e8;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("APT")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("APT").queryKey
      ) ?? 0;
      return {
        name: "APT",
        title: "Aptos",
        price,
        accountBalance
      };
    }
  });
}
function getBnbAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "bnb", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/bnb/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "bnb").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "bnb").balanceString;
      }
    }
  });
}

// src/modules/assets/external/bnb/get-bnb-asset-general-info-query-options.ts
function getBnbAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "bnb", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "BNB");
      await sdk.CONFIG.queryClient.fetchQuery(
        getBnbAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getBnbAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e18;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("BNB")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("BNB").queryKey
      ) ?? 0;
      return {
        name: "BNB",
        title: "Binance coin",
        price,
        accountBalance
      };
    }
  });
}
function getBtcAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "btc", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/btc/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "btc").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "btc").balanceString;
      }
    }
  });
}

// src/modules/assets/external/btc/get-btc-asset-general-info-query-options.ts
function getBtcAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "btc", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "BTC");
      await sdk.CONFIG.queryClient.fetchQuery(
        getBtcAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getBtcAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e8;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("BTC")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("BTC").queryKey
      ) ?? 0;
      return {
        name: "BTC",
        title: "Bitcoin",
        price,
        accountBalance
      };
    }
  });
}
function getEthAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "eth", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/eth/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "eth").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "eth").balanceString;
      }
    }
  });
}

// src/modules/assets/external/eth/get-eth-asset-general-info-query-options.ts
function getEthAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "eth", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "ETH");
      await sdk.CONFIG.queryClient.fetchQuery(
        getEthAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getEthAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e18;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("ETH")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("ETH").queryKey
      ) ?? 0;
      return {
        name: "ETH",
        title: "Ethereum",
        price,
        accountBalance
      };
    }
  });
}
function getSolAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "sol", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/sol/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "sol").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "sol").balanceString;
      }
    }
  });
}

// src/modules/assets/external/sol/get-sol-asset-general-info-query-options.ts
function getSolAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "sol", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "SOL");
      await sdk.CONFIG.queryClient.fetchQuery(
        getSolAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getSolAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e9;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("SOL")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("SOL").queryKey
      ) ?? 0;
      return {
        name: "SOL",
        title: "Solana",
        price,
        accountBalance
      };
    }
  });
}
function getTonAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "ton", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/ton/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "ton").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "ton").balanceString;
      }
    }
  });
}

// src/modules/assets/external/ton/get-ton-asset-general-info-query-options.ts
function getTonAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "ton", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TON");
      await sdk.CONFIG.queryClient.fetchQuery(
        getTonAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getTonAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e9;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("TON")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("TON").queryKey
      ) ?? 0;
      return {
        name: "TON",
        title: "The open network",
        price,
        accountBalance
      };
    }
  });
}
function getTronAssetBalanceQueryOptions(address) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "tron", "balance", address],
    queryFn: async () => {
      const baseUrl = `${sdk.CONFIG.privateApiHost}/private-api/balance/tron/${encodeURIComponent(
        address
      )}`;
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`[SDK][Wallets] \u2013 request failed(${baseUrl})`);
        }
        return +parsePrivateApiBalance2(await response.json(), "tron").balanceString;
      } catch (error) {
        console.error(error);
        const response = await fetch(`${baseUrl}?provider=chainz`);
        return +parsePrivateApiBalance2(await response.json(), "tron").balanceString;
      }
    }
  });
}

// src/modules/assets/external/tron/get-tron-asset-general-info-query-options.ts
function getTronAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "tron", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TRX");
      await sdk.CONFIG.queryClient.fetchQuery(
        getTronAssetBalanceQueryOptions(address)
      );
      const accountBalance = (sdk.CONFIG.queryClient.getQueryData(
        getTronAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e6;
      await sdk.CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("TRX")
      );
      const price = sdk.CONFIG.queryClient.getQueryData(
        getTokenPriceQueryOptions("TRX").queryKey
      ) ?? 0;
      return {
        name: "TRX",
        title: "Tron",
        price,
        accountBalance
      };
    }
  });
}

// src/modules/wallets/queries/get-account-wallet-asset-info-query-options.ts
function getAccountWalletAssetInfoQueryOptions(username, asset, options2 = { refetch: false }) {
  const queryClient = sdk.getQueryClient();
  const fetchQuery = async (queryOptions40) => {
    if (options2.refetch) {
      await queryClient.fetchQuery(queryOptions40);
    } else {
      await queryClient.prefetchQuery(queryOptions40);
    }
    return queryClient.getQueryData(queryOptions40.queryKey);
  };
  const portfolioQuery = getVisionPortfolioQueryOptions(username);
  const getPortfolioAssetInfo = async () => {
    try {
      const portfolio = await queryClient.fetchQuery(portfolioQuery);
      const assetInfo = portfolio.wallets.find(
        (assetItem) => assetItem.info.name === asset.toUpperCase()
      );
      return assetInfo?.info;
    } catch {
      return void 0;
    }
  };
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset],
    queryFn: async () => {
      const portfolioAssetInfo = await getPortfolioAssetInfo();
      if (portfolioAssetInfo) {
        return portfolioAssetInfo;
      }
      if (asset === "HIVE") {
        return fetchQuery(getHiveAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HP") {
        return fetchQuery(getHivePowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HBD") {
        return fetchQuery(getHbdAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SPK") {
        return fetchQuery(getSpkAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LARYNX") {
        return fetchQuery(getLarynxAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LP") {
        return fetchQuery(getLarynxPowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "POINTS") {
        return fetchQuery(getPointsAssetGeneralInfoQueryOptions(username));
      } else if (asset === "APT") {
        return fetchQuery(getAptAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BNB") {
        return fetchQuery(getBnbAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BTC") {
        return fetchQuery(getBtcAssetGeneralInfoQueryOptions(username));
      } else if (asset === "ETH") {
        return fetchQuery(getEthAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SOL") {
        return fetchQuery(getSolAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TON") {
        return fetchQuery(getTonAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TRX") {
        return fetchQuery(getTronAssetGeneralInfoQueryOptions(username));
      }
      const balances = await queryClient.ensureQueryData(
        getHiveEngineTokensBalancesQueryOptions(username)
      );
      if (balances.some((balance) => balance.symbol === asset)) {
        return await fetchQuery(
          getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
        );
      } else {
        throw new Error(
          "[SDK][Wallets] \u2013 has requested unrecognized asset info"
        );
      }
    }
  });
}
function getTokenOperationsQueryOptions(token, username, isForOwner = false) {
  return reactQuery.queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner],
    queryFn: async () => {
      const queryClient = sdk.getQueryClient();
      const normalizedToken = token.toUpperCase();
      const portfolioOperations = await (async () => {
        if (!isForOwner || !username) {
          return void 0;
        }
        try {
          const portfolio = await queryClient.fetchQuery(
            getVisionPortfolioQueryOptions(username)
          );
          const assetEntry = portfolio.wallets.find(
            (assetItem) => assetItem.info.name === normalizedToken
          );
          if (assetEntry?.operations.length) {
            return assetEntry.operations;
          }
        } catch {
          return void 0;
        }
        return void 0;
      })();
      if (portfolioOperations && portfolioOperations.length > 0) {
        return portfolioOperations;
      }
      const ensureAssetInfo = async () => {
        if (!isForOwner || !username) {
          return void 0;
        }
        return await queryClient.ensureQueryData(
          getAccountWalletAssetInfoQueryOptions(username, normalizedToken)
        );
      };
      switch (normalizedToken) {
        case "HIVE" /* Hive */: {
          const assetInfo = await ensureAssetInfo();
          const savingsBalance = assetInfo?.parts?.find(
            (part) => part.name === "savings"
          )?.balance;
          const pendingSavingsWithdrawAmount = await (async () => {
            if (!isForOwner || !username) {
              return 0;
            }
            try {
              const response = await sdk.CONFIG.hiveClient.database.call(
                "get_savings_withdraw_from",
                [username]
              );
              return response.reduce((total, request) => {
                const parsed = parseAsset(request.amount);
                return parsed.symbol === "HIVE" /* HIVE */ ? total + parsed.amount : total;
              }, 0);
            } catch {
              return 0;
            }
          })();
          const hasAvailableSavingsWithdraw = typeof savingsBalance === "number" && savingsBalance - pendingSavingsWithdrawAmount > 1e-6;
          return [
            "transfer" /* Transfer */,
            ...isForOwner ? [
              ...hasAvailableSavingsWithdraw ? ["withdraw-saving" /* WithdrawFromSavings */] : [],
              "transfer-saving" /* TransferToSavings */,
              "power-up" /* PowerUp */,
              "swap" /* Swap */
            ] : []
          ];
        }
        case "HP" /* HivePower */:
          return [
            "delegate" /* Delegate */,
            ...isForOwner ? ["power-down" /* PowerDown */, "withdraw-routes" /* WithdrawRoutes */] : ["power-up" /* PowerUp */]
          ];
        case "HBD" /* HiveDollar */: {
          const assetInfo = await ensureAssetInfo();
          const savingsBalance = assetInfo?.parts?.find(
            (part) => part.name === "savings"
          )?.balance;
          const pendingSavingsWithdrawAmount = await (async () => {
            if (!isForOwner || !username) {
              return 0;
            }
            try {
              const response = await sdk.CONFIG.hiveClient.database.call(
                "get_savings_withdraw_from",
                [username]
              );
              return response.reduce((total, request) => {
                const parsed = parseAsset(request.amount);
                return parsed.symbol === "HBD" /* HBD */ ? total + parsed.amount : total;
              }, 0);
            } catch {
              return 0;
            }
          })();
          const hasAvailableSavingsWithdraw = typeof savingsBalance === "number" && savingsBalance - pendingSavingsWithdrawAmount > 1e-6;
          return [
            "transfer" /* Transfer */,
            ...isForOwner ? [
              ...hasAvailableSavingsWithdraw ? ["withdraw-saving" /* WithdrawFromSavings */] : [],
              "transfer-saving" /* TransferToSavings */,
              "swap" /* Swap */
            ] : []
          ];
        }
        case "POINTS" /* Points */:
          return [
            "gift" /* Gift */,
            ...isForOwner ? [
              "promote" /* Promote */,
              "claim" /* Claim */,
              "buy" /* Buy */
            ] : []
          ];
        case "SPK":
          return ["transfer" /* Transfer */];
        case "LARYNX":
          return [
            "transfer" /* Transfer */,
            ...isForOwner ? ["power-up" /* PowerUp */, "lock" /* LockLiquidity */] : []
          ];
        case "LP":
          return [
            "delegate" /* Delegate */,
            ...isForOwner ? ["power-down" /* PowerDown */] : []
          ];
        case "APT":
        case "BNB":
        case "BTC":
        case "ETH":
        case "SOL":
        case "TON":
        case "TRX":
          return [];
      }
      if (!username) {
        return ["transfer" /* Transfer */];
      }
      const balancesListQuery = getHiveEngineTokensBalancesQueryOptions(username);
      const balances = await queryClient.ensureQueryData(balancesListQuery);
      const tokensQuery = getHiveEngineTokensMetadataQueryOptions(
        balances.map((b) => b.symbol)
      );
      const tokens = await queryClient.ensureQueryData(tokensQuery);
      const balanceInfo = balances.find((m) => m.symbol === token);
      const tokenInfo = tokens.find((t) => t.symbol === token);
      const canDelegate = isForOwner && tokenInfo?.delegationEnabled && balanceInfo && parseFloat(balanceInfo.delegationsOut) !== parseFloat(balanceInfo.balance);
      const canUndelegate = isForOwner && parseFloat(balanceInfo?.delegationsOut ?? "0") > 0;
      const stakeBalance = parseFloat(balanceInfo?.stake ?? "0");
      const pendingUnstakeBalance = parseFloat(
        balanceInfo?.pendingUnstake ?? "0"
      );
      const supportsStakingFeature = Boolean(
        tokenInfo?.stakingEnabled || (tokenInfo?.unstakingCooldown ?? 0) > 0 || parseFloat(tokenInfo?.totalStaked ?? "0") > 0
      );
      const hasStakingBalances = stakeBalance > 0 || pendingUnstakeBalance > 0;
      const canStake = isForOwner && Boolean(tokenInfo?.stakingEnabled);
      const canUnstake = isForOwner && (supportsStakingFeature || hasStakingBalances);
      return [
        "transfer" /* Transfer */,
        ...canDelegate ? ["delegate" /* Delegate */] : [],
        ...canUndelegate ? ["undelegate" /* Undelegate */] : [],
        ...canStake ? ["stake" /* Stake */] : [],
        ...canUnstake ? ["unstake" /* Unstake */] : []
      ];
    }
  });
}
function useWalletsCacheQuery(username) {
  const queryClient = reactQuery.useQueryClient();
  const queryKey = ["ecency-wallets", "wallets", username];
  const getCachedWallets = () => queryClient.getQueryData(queryKey);
  const createEmptyWalletMap = () => /* @__PURE__ */ new Map();
  return reactQuery.useQuery({
    queryKey,
    enabled: Boolean(username),
    initialData: () => getCachedWallets() ?? createEmptyWalletMap(),
    queryFn: async () => getCachedWallets() ?? createEmptyWalletMap(),
    staleTime: Infinity
  });
}
var PATHS = {
  ["BTC" /* BTC */]: "m/44'/0'/0'/0/0",
  // Bitcoin (BIP44)
  ["ETH" /* ETH */]: "m/44'/60'/0'/0/0",
  // Ethereum (BIP44)
  ["BNB" /* BNB */]: "m/44'/60'/0'/0/0",
  // BNB Smart Chain (BIP44)
  ["SOL" /* SOL */]: "m/44'/501'/0'/0'",
  // Solana (BIP44)
  ["TON" /* TON */]: "m/44'/607'/0'",
  // TON (BIP44)
  ["TRX" /* TRON */]: "m/44'/195'/0'/0/0",
  // Tron (BIP44)
  ["APT" /* APT */]: "m/44'/637'/0'/0'/0'"
  // Aptos (BIP44)
};
function useWalletCreate(username, currency) {
  const { data: mnemonic } = useSeedPhrase(username);
  const queryClient = reactQuery.useQueryClient();
  const createWallet = reactQuery.useMutation({
    mutationKey: ["ecency-wallets", "create-wallet", username, currency],
    mutationFn: async () => {
      if (!mnemonic) {
        throw new Error("[Ecency][Wallets] - No seed to create a wallet");
      }
      const wallet = getWallet(currency);
      const privateKey = await wallet?.getDerivedPrivateKey({
        mnemonic,
        hdPath: PATHS[currency]
      });
      await delay(1e3);
      const address = await wallet?.getNewAddress({
        privateKey
      });
      return {
        privateKey,
        address: address.address,
        publicKey: address.publicKey,
        username,
        currency
      };
    },
    onSuccess: (info) => {
      queryClient.setQueryData(
        ["ecency-wallets", "wallets", info.username],
        (data) => new Map(data ? Array.from(data.entries()) : []).set(
          info.currency,
          info
        )
      );
    }
  });
  const importWallet = () => {
  };
  return {
    createWallet,
    importWallet
  };
}

// src/modules/wallets/mutations/private-api/index.ts
var private_api_exports = {};
__export(private_api_exports, {
  useCheckWalletExistence: () => useCheckWalletExistence,
  useCreateAccountWithWallets: () => useCreateAccountWithWallets,
  useUpdateAccountWithWallets: () => useUpdateAccountWithWallets
});
function useCreateAccountWithWallets(username) {
  const { data } = useWalletsCacheQuery(username);
  const { data: hiveKeys } = useHiveKeysQuery(username);
  const fetchApi = getBoundFetch();
  return reactQuery.useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: ({ currency, address }) => fetchApi(sdk.CONFIG.privateApiHost + "/private-api/wallets-add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        token: currency,
        address,
        meta: {
          ownerPublicKey: hiveKeys?.ownerPubkey,
          activePublicKey: hiveKeys?.activePubkey,
          postingPublicKey: hiveKeys?.postingPubkey,
          memoPublicKey: hiveKeys?.memoPubkey,
          ...Array.from(data?.entries() ?? []).reduce(
            (acc, [curr, info]) => ({
              ...acc,
              [curr]: info.address
            }),
            {}
          )
        }
      })
    })
  });
}
function useCheckWalletExistence() {
  return reactQuery.useMutation({
    mutationKey: ["ecency-wallets", "check-wallet-existence"],
    mutationFn: async ({ address, currency }) => {
      const response = await fetch(
        sdk.CONFIG.privateApiHost + "/private-api/wallets-exist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            address,
            token: currency
          })
        }
      );
      const data = await response.json();
      return data.length === 0;
    }
  });
}
function useUpdateAccountWithWallets(username) {
  const fetchApi = getBoundFetch();
  return reactQuery.useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: async ({ tokens, hiveKeys }) => {
      const entries = Object.entries(tokens).filter(([, address]) => Boolean(address));
      if (entries.length === 0) {
        return new Response(null, { status: 204 });
      }
      const [primaryToken, primaryAddress] = entries[0] ?? ["", ""];
      return fetchApi(sdk.CONFIG.privateApiHost + "/private-api/wallets-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          code: sdk.getAccessToken(username),
          token: primaryToken,
          address: primaryAddress,
          status: 3,
          meta: {
            ...Object.fromEntries(entries),
            ownerPublicKey: hiveKeys.ownerPublicKey,
            activePublicKey: hiveKeys.activePublicKey,
            postingPublicKey: hiveKeys.postingPublicKey,
            memoPublicKey: hiveKeys.memoPublicKey
          }
        })
      });
    }
  });
}

// src/modules/wallets/functions/get-keys-from-seed.ts
var HD_PATHS = {
  ["BTC" /* BTC */]: ["m/84'/0'/0'/0/0"],
  ["ETH" /* ETH */]: ["m/84'/60'/0'/0/0"],
  // its not working for Trust, Exodus, todo: check others below
  ["BNB" /* BNB */]: ["m/84'/60'/0'/0/0"],
  ["SOL" /* SOL */]: ["m/84'/501'/0'/0/0"],
  ["TRX" /* TRON */]: ["m/44'/195'/0'/0'/0'"],
  ["APT" /* APT */]: ["m/84'/637'/0'/0/0"],
  ["TON" /* TON */]: ["m/44'/607'/0'"]
};
async function getKeysFromSeed(mnemonic, wallet, currency) {
  for (const hdPath of HD_PATHS[currency] || []) {
    try {
      const derivedPrivateKey = await wallet.getDerivedPrivateKey({
        mnemonic,
        hdPath
      });
      const derivedPublicKey = await wallet.getNewAddress({
        privateKey: derivedPrivateKey,
        addressType: currency === "BTC" /* BTC */ ? "segwit_native" : void 0
      });
      return [derivedPrivateKey.toString(), derivedPublicKey.address];
    } catch (error) {
      return [];
    }
  }
  return [];
}
function useImportWallet(username, currency) {
  const queryClient = reactQuery.useQueryClient();
  const { mutateAsync: checkWalletExistence } = private_api_exports.useCheckWalletExistence();
  return reactQuery.useMutation({
    mutationKey: ["ecency-wallets", "import-wallet", username, currency],
    mutationFn: async ({ privateKeyOrSeed }) => {
      const wallet = getWallet(currency);
      if (!wallet) {
        throw new Error("Cannot find token for this currency");
      }
      const isSeed = privateKeyOrSeed.split(" ").length === 12;
      let address;
      let privateKey = privateKeyOrSeed;
      if (isSeed) {
        [privateKey, address] = await getKeysFromSeed(
          privateKeyOrSeed,
          wallet,
          currency
        );
      } else {
        address = (await wallet.getNewAddress({
          privateKey: privateKeyOrSeed
        })).address;
      }
      if (!address || !privateKeyOrSeed) {
        throw new Error(
          "Private key/seed phrase isn't matching with public key or token"
        );
      }
      const hasChecked = await checkWalletExistence({
        address,
        currency
      });
      if (!hasChecked) {
        throw new Error(
          "This wallet has already in use by Hive account. Please, try another one"
        );
      }
      return {
        privateKey,
        address,
        publicKey: ""
      };
    },
    onSuccess: ({ privateKey, publicKey, address }) => {
      queryClient.setQueryData(
        ["ecency-wallets", "wallets", username],
        (data) => new Map(data ? Array.from(data.entries()) : []).set(currency, {
          privateKey,
          publicKey,
          address,
          username,
          currency,
          type: "CHAIN",
          custom: true
        })
      );
    }
  });
}
function getGroupedChainTokens(tokens, defaultShow) {
  if (!tokens) {
    return {};
  }
  return R__namespace.pipe(
    tokens,
    R__namespace.filter(
      ({ type, symbol }) => type === "CHAIN" || Object.values(EcencyWalletCurrency).includes(symbol)
    ),
    R__namespace.map((item) => {
      const meta = {
        ...item.meta ?? {}
      };
      if (typeof meta.show !== "boolean" && typeof defaultShow === "boolean") {
        meta.show = defaultShow;
      }
      return {
        ...item,
        meta
      };
    }),
    // Chain tokens are unique by symbol, so indexing by symbol
    // gives a direct lookup map instead of an array-based grouping.
    R__namespace.indexBy(
      (item) => item.symbol
    )
  );
}
function useSaveWalletInformationToMetadata(username, options2) {
  const queryClient = reactQuery.useQueryClient();
  const { data: accountData } = reactQuery.useQuery(sdk.getAccountFullQueryOptions(username));
  const { mutateAsync: updateProfile } = sdk.useAccountUpdate(username);
  return reactQuery.useMutation({
    mutationKey: [
      "ecency-wallets",
      "save-wallet-to-metadata",
      accountData?.name
    ],
    mutationFn: async (tokens) => {
      if (!accountData) {
        throw new Error("[SDK][Wallets] \u2013 no account data to save wallets");
      }
      const profileChainTokens = getGroupedChainTokens(
        accountData.profile?.tokens
      );
      const payloadTokens = tokens.map(({ currency, type, privateKey, username: username2, ...meta }) => ({
        symbol: currency,
        type: type ?? (Object.values(EcencyWalletCurrency).includes(currency) ? "CHAIN" : void 0),
        meta
      })) ?? [];
      const payloadChainTokens = getGroupedChainTokens(payloadTokens, true);
      const payloadNonChainTokens = payloadTokens.filter(
        ({ type, symbol }) => type !== "CHAIN" && !Object.values(EcencyWalletCurrency).includes(symbol)
      );
      const mergedChainTokens = R__namespace.pipe(
        profileChainTokens,
        R__namespace.mergeDeep(payloadChainTokens),
        R__namespace.values()
      );
      return updateProfile({
        tokens: [
          ...payloadNonChainTokens,
          ...mergedChainTokens
        ]
      });
    },
    onError: options2?.onError,
    onSuccess: (response, vars, context) => {
      options2?.onSuccess?.(response, vars, context);
      queryClient.invalidateQueries({
        queryKey: getAccountWalletListQueryOptions(username).queryKey
      });
    }
  });
}
var operationToFunctionMap = {
  HIVE: {
    ["transfer" /* Transfer */]: transferHive,
    ["transfer-saving" /* TransferToSavings */]: transferToSavingsHive,
    ["withdraw-saving" /* WithdrawFromSavings */]: transferFromSavingsHive,
    ["power-up" /* PowerUp */]: powerUpHive
  },
  HBD: {
    ["transfer" /* Transfer */]: transferHive,
    ["transfer-saving" /* TransferToSavings */]: transferToSavingsHive,
    ["withdraw-saving" /* WithdrawFromSavings */]: transferFromSavingsHive,
    ["claim-interest" /* ClaimInterest */]: claimInterestHive
  },
  HP: {
    ["power-down" /* PowerDown */]: powerDownHive,
    ["delegate" /* Delegate */]: delegateHive,
    ["withdraw-routes" /* WithdrawRoutes */]: withdrawVestingRouteHive
  },
  POINTS: {
    ["gift" /* Gift */]: transferPoint
  },
  SPK: {
    ["transfer" /* Transfer */]: transferSpk
  },
  LARYNX: {
    ["transfer" /* Transfer */]: transferLarynx,
    ["lock" /* LockLiquidity */]: lockLarynx,
    ["power-up" /* PowerUp */]: powerUpLarynx
  }
};
var engineOperationToFunctionMap = {
  ["transfer" /* Transfer */]: transferEngineToken,
  ["stake" /* Stake */]: stakeEngineToken,
  ["unstake" /* Unstake */]: unstakeEngineToken,
  ["delegate" /* Delegate */]: delegateEngineToken,
  ["undelegate" /* Undelegate */]: undelegateEngineToken
};
function useWalletOperation(username, asset, operation) {
  const { mutateAsync: recordActivity } = sdk.EcencyAnalytics.useRecordActivity(
    username,
    operation
  );
  return reactQuery.useMutation({
    mutationKey: ["ecency-wallets", asset, operation],
    mutationFn: async (payload) => {
      const operationFn = operationToFunctionMap[asset]?.[operation];
      if (operationFn) {
        return operationFn(payload);
      }
      const balancesListQuery = getHiveEngineTokensBalancesQueryOptions(username);
      await sdk.getQueryClient().prefetchQuery(balancesListQuery);
      const balances = sdk.getQueryClient().getQueryData(
        balancesListQuery.queryKey
      );
      if (balances?.some((b) => b.symbol === asset)) {
        const operationFn2 = engineOperationToFunctionMap[operation];
        if (operationFn2) {
          return operationFn2({ ...payload, asset });
        }
      }
      throw new Error("[SDK][Wallets] \u2013 no operation for given asset");
    },
    onSuccess: () => {
      recordActivity();
      const assetsToRefresh = /* @__PURE__ */ new Set([asset]);
      if (asset === "HIVE") {
        assetsToRefresh.add("HP");
        assetsToRefresh.add("HIVE");
      }
      if (asset === "HBD") {
        assetsToRefresh.add("HBD");
      }
      if (asset === "LARYNX" && operation === "power-up" /* PowerUp */) {
        assetsToRefresh.add("LP");
        assetsToRefresh.add("LARYNX");
      }
      assetsToRefresh.forEach((symbol) => {
        const query = getAccountWalletAssetInfoQueryOptions(username, symbol, {
          refetch: true
        });
        setTimeout(
          () => sdk.getQueryClient().invalidateQueries({
            queryKey: query.queryKey
          }),
          5e3
        );
      });
    }
  });
}

// src/index.ts
rememberScryptBsvVersion();

exports.AssetOperation = AssetOperation;
exports.EcencyWalletBasicTokens = EcencyWalletBasicTokens;
exports.EcencyWalletCurrency = EcencyWalletCurrency;
exports.EcencyWalletsPrivateApi = private_api_exports;
exports.HIVE_ACCOUNT_OPERATION_GROUPS = HIVE_ACCOUNT_OPERATION_GROUPS;
exports.HIVE_OPERATION_LIST = HIVE_OPERATION_LIST;
exports.HIVE_OPERATION_NAME_BY_ID = HIVE_OPERATION_NAME_BY_ID;
exports.HIVE_OPERATION_ORDERS = HIVE_OPERATION_ORDERS;
exports.NaiMap = NaiMap;
exports.PointTransactionType = PointTransactionType;
exports.Symbol = Symbol2;
exports.broadcastWithWalletHiveAuth = broadcastWithWalletHiveAuth;
exports.buildAptTx = buildAptTx;
exports.buildEthTx = buildEthTx;
exports.buildExternalTx = buildExternalTx;
exports.buildPsbt = buildPsbt;
exports.buildSolTx = buildSolTx;
exports.buildTonTx = buildTonTx;
exports.buildTronTx = buildTronTx;
exports.claimInterestHive = claimInterestHive;
exports.decryptMemoWithAccounts = decryptMemoWithAccounts;
exports.decryptMemoWithKeys = decryptMemoWithKeys;
exports.delay = delay;
exports.delegateEngineToken = delegateEngineToken;
exports.delegateHive = delegateHive;
exports.deriveHiveKey = deriveHiveKey;
exports.deriveHiveKeys = deriveHiveKeys;
exports.deriveHiveMasterPasswordKey = deriveHiveMasterPasswordKey;
exports.deriveHiveMasterPasswordKeys = deriveHiveMasterPasswordKeys;
exports.detectHiveKeyDerivation = detectHiveKeyDerivation;
exports.encryptMemoWithAccounts = encryptMemoWithAccounts;
exports.encryptMemoWithKeys = encryptMemoWithKeys;
exports.getAccountWalletAssetInfoQueryOptions = getAccountWalletAssetInfoQueryOptions;
exports.getAccountWalletListQueryOptions = getAccountWalletListQueryOptions;
exports.getAllTokensListQueryOptions = getAllTokensListQueryOptions;
exports.getBoundFetch = getBoundFetch;
exports.getHbdAssetGeneralInfoQueryOptions = getHbdAssetGeneralInfoQueryOptions;
exports.getHbdAssetTransactionsQueryOptions = getHbdAssetTransactionsQueryOptions;
exports.getHiveAssetGeneralInfoQueryOptions = getHiveAssetGeneralInfoQueryOptions;
exports.getHiveAssetMetricQueryOptions = getHiveAssetMetricQueryOptions;
exports.getHiveAssetTransactionsQueryOptions = getHiveAssetTransactionsQueryOptions;
exports.getHiveAssetWithdrawalRoutesQueryOptions = getHiveAssetWithdrawalRoutesQueryOptions;
exports.getHiveEngineTokenGeneralInfoQueryOptions = getHiveEngineTokenGeneralInfoQueryOptions;
exports.getHiveEngineTokenTransactionsQueryOptions = getHiveEngineTokenTransactionsQueryOptions;
exports.getHiveEngineTokensBalancesQueryOptions = getHiveEngineTokensBalancesQueryOptions;
exports.getHiveEngineTokensMarketQueryOptions = getHiveEngineTokensMarketQueryOptions;
exports.getHiveEngineTokensMetadataQueryOptions = getHiveEngineTokensMetadataQueryOptions;
exports.getHiveEngineTokensMetricsQueryOptions = getHiveEngineTokensMetricsQueryOptions;
exports.getHivePowerAssetGeneralInfoQueryOptions = getHivePowerAssetGeneralInfoQueryOptions;
exports.getHivePowerAssetTransactionsQueryOptions = getHivePowerAssetTransactionsQueryOptions;
exports.getHivePowerDelegatesInfiniteQueryOptions = getHivePowerDelegatesInfiniteQueryOptions;
exports.getHivePowerDelegatingsQueryOptions = getHivePowerDelegatingsQueryOptions;
exports.getLarynxAssetGeneralInfoQueryOptions = getLarynxAssetGeneralInfoQueryOptions;
exports.getLarynxPowerAssetGeneralInfoQueryOptions = getLarynxPowerAssetGeneralInfoQueryOptions;
exports.getPointsAssetGeneralInfoQueryOptions = getPointsAssetGeneralInfoQueryOptions;
exports.getPointsAssetTransactionsQueryOptions = getPointsAssetTransactionsQueryOptions;
exports.getPointsQueryOptions = getPointsQueryOptions;
exports.getSpkAssetGeneralInfoQueryOptions = getSpkAssetGeneralInfoQueryOptions;
exports.getSpkMarketsQueryOptions = getSpkMarketsQueryOptions;
exports.getTokenOperationsQueryOptions = getTokenOperationsQueryOptions;
exports.getTokenPriceQueryOptions = getTokenPriceQueryOptions;
exports.getVisionPortfolioQueryOptions = getVisionPortfolioQueryOptions;
exports.getWallet = getWallet;
exports.hasWalletHiveAuthBroadcast = hasWalletHiveAuthBroadcast;
exports.isEmptyDate = isEmptyDate;
exports.lockLarynx = lockLarynx;
exports.mnemonicToSeedBip39 = mnemonicToSeedBip39;
exports.parseAsset = parseAsset;
exports.powerDownHive = powerDownHive;
exports.powerUpHive = powerUpHive;
exports.powerUpLarynx = powerUpLarynx;
exports.registerWalletHiveAuthBroadcast = registerWalletHiveAuthBroadcast;
exports.resolveHiveOperationFilters = resolveHiveOperationFilters;
exports.rewardSpk = rewardSpk;
exports.signDigest = signDigest;
exports.signExternalTx = signExternalTx;
exports.signExternalTxAndBroadcast = signExternalTxAndBroadcast;
exports.signTx = signTx;
exports.signTxAndBroadcast = signTxAndBroadcast;
exports.stakeEngineToken = stakeEngineToken;
exports.transferEngineToken = transferEngineToken;
exports.transferFromSavingsHive = transferFromSavingsHive;
exports.transferHive = transferHive;
exports.transferLarynx = transferLarynx;
exports.transferPoint = transferPoint;
exports.transferSpk = transferSpk;
exports.transferToSavingsHive = transferToSavingsHive;
exports.undelegateEngineToken = undelegateEngineToken;
exports.unstakeEngineToken = unstakeEngineToken;
exports.useClaimPoints = useClaimPoints;
exports.useClaimRewards = useClaimRewards;
exports.useGetExternalWalletBalanceQuery = useGetExternalWalletBalanceQuery;
exports.useHiveKeysQuery = useHiveKeysQuery;
exports.useImportWallet = useImportWallet;
exports.useSaveWalletInformationToMetadata = useSaveWalletInformationToMetadata;
exports.useSeedPhrase = useSeedPhrase;
exports.useWalletCreate = useWalletCreate;
exports.useWalletOperation = useWalletOperation;
exports.useWalletsCacheQuery = useWalletsCacheQuery;
exports.vestsToHp = vestsToHp;
exports.withdrawVestingRouteHive = withdrawVestingRouteHive;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map