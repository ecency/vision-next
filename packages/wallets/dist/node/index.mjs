import { CONFIG, getAccountFullQueryOptions, getQueryClient, getDynamicPropsQueryOptions, useBroadcastMutation, getSpkMarkets, getSpkWallet, getHiveEngineTokensMarket, getHiveEngineTokensBalances, getHiveEngineTokensMetadata, getHiveEngineTokenTransactions, getHiveEngineTokenMetrics, getHiveEngineUnclaimedRewards, EcencyAnalytics, useAccountUpdate, getCurrencyRate } from '@ecency/sdk';
export { getHiveEngineMetrics, getHiveEngineOpenOrders, getHiveEngineOrderBook, getHiveEngineTradeHistory } from '@ecency/sdk';
import { useQuery, queryOptions, infiniteQueryOptions, useQueryClient, useMutation } from '@tanstack/react-query';
import bip39, { mnemonicToSeedSync } from 'bip39';
import { LRUCache } from 'lru-cache';
import { BtcWallet, buildPsbt as buildPsbt$1 } from '@okxweb3/coin-bitcoin';
import { EthWallet } from '@okxweb3/coin-ethereum';
import { TrxWallet } from '@okxweb3/coin-tron';
import { TonWallet } from '@okxweb3/coin-ton';
import { SolWallet } from '@okxweb3/coin-solana';
import { AptosWallet } from '@okxweb3/coin-aptos';
import { bip32 } from '@okxweb3/crypto-lib';
import { utils, PrivateKey } from '@hiveio/dhive';
import { cryptoUtils } from '@hiveio/dhive/lib/crypto';
import { Memo } from '@hiveio/dhive/lib/memo';
import dayjs from 'dayjs';
import hs from 'hivesigner';
import numeral from 'numeral';
import * as R from 'remeda';

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
  return useQuery({
    queryKey: ["ecency-wallets", "external-wallet-balance", currency, address],
    queryFn: async () => {
      const chain = currencyChainMap[currency];
      if (!chain) {
        throw new Error(`Unsupported currency ${currency}`);
      }
      if (!CONFIG.privateApiHost) {
        throw new Error("Private API host is not configured");
      }
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/${chain}/${encodeURIComponent(
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
  return useQuery({
    queryKey: ["ecency-wallets", "seed", username],
    queryFn: async () => bip39.generateMnemonic(128),
    // CRITICAL: Prevent seed regeneration - cache forever
    // Once generated, the seed must NEVER change to ensure consistency between:
    // 1. Displayed seed phrase
    // 2. Downloaded seed file
    // 3. Keys sent to API for account creation
    staleTime: Infinity,
    gcTime: Infinity
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
var cache = new LRUCache(options);
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
  return queryOptions({
    queryKey: ["ecency-wallets", "market-data", currency],
    queryFn: async () => {
      if (!currency) {
        throw new Error(
          "[SDK][Wallets][MarketData] \u2013 currency wasn`t provided"
        );
      }
      if (!CONFIG.privateApiHost) {
        throw new Error(
          "[SDK][Wallets][MarketData] \u2013 privateApiHost isn`t configured"
        );
      }
      const token = normalizeCurrencyToToken(currency);
      let marketData = cacheGet(MARKET_DATA_CACHE_KEY);
      if (!marketData) {
        const httpResponse = await fetch(
          `${CONFIG.privateApiHost}/private-api/market-data/latest`,
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
      return new BtcWallet();
    case "ETH" /* ETH */:
    case "BNB" /* BNB */:
      return new EthWallet();
    case "TRX" /* TRON */:
      return new TrxWallet();
    case "TON" /* TON */:
      return new TonWallet();
    case "SOL" /* SOL */:
      return new SolWallet();
    case "APT" /* APT */:
      return new AptosWallet();
    default:
      return void 0;
  }
}
function mnemonicToSeedBip39(value) {
  return mnemonicToSeedSync(value).toString("hex");
}
var ROLE_INDEX = {
  owner: 0,
  active: 1,
  posting: 2,
  memo: 3
};
function deriveHiveKey(mnemonic, role, accountIndex = 0) {
  const seed = mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed);
  const path = `m/44'/3054'/${accountIndex}'/0'/${ROLE_INDEX[role]}'`;
  const child = master.derivePath(path);
  if (!child.privateKey) {
    throw new Error("[Ecency][Wallets] - hive key derivation failed");
  }
  const pk = PrivateKey.from(child.privateKey);
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
  const pk = PrivateKey.fromLogin(username, masterPassword, role);
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
  const account = await CONFIG.queryClient.fetchQuery(
    getAccountFullQueryOptions(uname)
  );
  const auth = account[type];
  const bip44 = deriveHiveKeys(seed);
  const bip44Pub = type === "owner" ? bip44.ownerPubkey : bip44.activePubkey;
  const matchBip44 = auth.key_auths.some(([pub]) => String(pub) === bip44Pub);
  if (matchBip44) return "bip44";
  const legacyPub = PrivateKey.fromLogin(uname, seed, type).createPublic().toString();
  const matchLegacy = auth.key_auths.some(([pub]) => String(pub) === legacyPub);
  if (matchLegacy) return "master-password";
  return "unknown";
}
function signDigest(digest, privateKey) {
  const key = PrivateKey.fromString(privateKey);
  const buf = typeof digest === "string" ? Buffer.from(digest, "hex") : digest;
  return key.sign(buf).toString();
}
function signTx(tx, privateKey, chainId) {
  const key = PrivateKey.fromString(privateKey);
  const chain = chainId ? Buffer.from(chainId, "hex") : void 0;
  return cryptoUtils.signTransaction(tx, key, chain);
}
async function signTxAndBroadcast(client, tx, privateKey, chainId) {
  const signed = signTx(tx, privateKey, chainId);
  return client.broadcast.send(signed);
}
function encryptMemoWithKeys(privateKey, publicKey, memo) {
  return Memo.encode(PrivateKey.fromString(privateKey), publicKey, memo);
}
async function encryptMemoWithAccounts(client, fromPrivateKey, toAccount, memo) {
  const [account] = await client.database.getAccounts([toAccount]);
  if (!account) {
    throw new Error("Account not found");
  }
  return Memo.encode(PrivateKey.fromString(fromPrivateKey), account.memo_key, memo);
}
function decryptMemoWithKeys(privateKey, memo) {
  return Memo.decode(PrivateKey.fromString(privateKey), memo);
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
        `https://rpc.helius.xyz/?api-key=${CONFIG.heliusApiKey}`,
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
  return buildPsbt$1(tx, network, maximumFeeRate);
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
  return useQuery({
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
  return queryOptions({
    queryKey: ["assets", "hive", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );
      const dynamicProps = getQueryClient().getQueryData(
        getDynamicPropsQueryOptions().queryKey
      );
      const accountData = getQueryClient().getQueryData(
        getAccountFullQueryOptions(username).queryKey
      );
      const marketTicker = await CONFIG.hiveClient.call("condenser_api", "get_ticker", []).catch(() => void 0);
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
  return queryOptions({
    queryKey: ["assets", "hive-power", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );
      const dynamicProps = getQueryClient().getQueryData(
        getDynamicPropsQueryOptions().queryKey
      );
      const accountData = getQueryClient().getQueryData(
        getAccountFullQueryOptions(username).queryKey
      );
      if (!dynamicProps || !accountData) {
        return {
          name: "HP",
          title: "Hive Power",
          price: 0,
          accountBalance: 0
        };
      }
      const marketTicker = await CONFIG.hiveClient.call("condenser_api", "get_ticker", []).catch(() => void 0);
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
  return queryOptions({
    queryKey: ["assets", "hbd", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );
      const accountData = getQueryClient().getQueryData(
        getAccountFullQueryOptions(username).queryKey
      );
      const dynamicProps = getQueryClient().getQueryData(
        getDynamicPropsQueryOptions().queryKey
      );
      let price = 1;
      try {
        await CONFIG.queryClient.prefetchQuery(
          getTokenPriceQueryOptions("HBD")
        );
        const marketPrice = CONFIG.queryClient.getQueryData(
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
var ops = utils.operationOrders;
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
  utils.operationOrders
);
var operationOrders = utils.operationOrders;
var HIVE_OPERATION_ORDERS = operationOrders;
var HIVE_OPERATION_NAME_BY_ID = Object.entries(operationOrders).reduce((acc, [name, id]) => {
  acc[id] = name;
  return acc;
}, {});

// src/modules/assets/hive/queries/get-hive-asset-transactions-query-options.ts
var operationOrders2 = utils.operationOrders;
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
  return infiniteQueryOptions({
    queryKey: ["assets", "hive", "transactions", username, limit, filterKey],
    initialData: { pages: [], pageParams: [] },
    initialPageParam: -1,
    getNextPageParam: (lastPage, __) => lastPage ? +(lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1,
    queryFn: async ({ pageParam }) => {
      const response = await CONFIG.hiveClient.call(
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
            case "transfer_from_savings":
              return parseAsset(item.amount).symbol === "HIVE";
            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HIVE"].includes(asset.symbol);
            case "claim_reward_balance":
              const rewardHive = parseAsset(
                item.reward_hive
              );
              return rewardHive.amount > 0;
            case "curation_reward":
            case "cancel_transfer_from_savings":
            case "fill_order":
            case "limit_order_create":
            case "limit_order_cancel":
            case "fill_convert_request":
            case "fill_collateralized_convert_request":
              return true;
            case "limit_order_create2":
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
  const userSelectedOperations = new Set(
    Array.isArray(filters) ? filters : [filters]
  );
  const hasAllFilter = userSelectedOperations.has("") || userSelectedOperations.size === 0;
  return infiniteQueryOptions({
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
              return hasAllFilter || userSelectedOperations.has(item.type);
          }
        })
      )
    })
  });
}
function getHbdAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterKey } = resolveHiveOperationFilters(filters);
  return infiniteQueryOptions({
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
            case "transfer_from_savings":
              return parseAsset(item.amount).symbol === "HBD";
            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HBD"].includes(asset.symbol);
            case "cancel_transfer_from_savings":
            case "fill_order":
            case "limit_order_create":
            case "limit_order_cancel":
            case "fill_convert_request":
            case "fill_collateralized_convert_request":
            case "proposal_pay":
            case "interest":
              return true;
            case "limit_order_create2":
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
  return infiniteQueryOptions({
    queryKey: ["assets", "hive", "metrics", bucketSeconds],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [
          bucketSeconds,
          dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
          dayjs(endDate).format("YYYY-MM-DDTHH:mm:ss")
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
      dayjs().subtract(Math.max(100 * bucketSeconds, 28800), "second").toDate(),
      /* @__PURE__ */ new Date()
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      dayjs(prevStartDate.getTime()).subtract(Math.max(100 * bucketSeconds, 28800), "second").toDate(),
      dayjs(prevStartDate.getTime()).subtract(bucketSeconds, "second").toDate()
    ]
  });
}
function getHiveAssetWithdrawalRoutesQueryOptions(username) {
  return queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () => CONFIG.hiveClient.database.call("get_withdraw_routes", [
      username,
      "outgoing"
    ])
  });
}
function getHivePowerDelegatesInfiniteQueryOptions(username, limit = 50) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "delegates", username],
    enabled: !!username,
    queryFn: () => CONFIG.hiveClient.database.call("get_vesting_delegations", [
      username,
      "",
      limit
    ])
  });
}
function getHivePowerDelegatingsQueryOptions(username) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "delegatings", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/received-vesting/${username}`,
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

// src/modules/assets/utils/keychain-fallback.ts
async function broadcastWithKeychainFallback(account, operations, authority = "Active") {
  if (typeof window === "undefined" || !window.hive_keychain) {
    throw new Error("[SDK][Wallets] \u2013 Keychain extension not found");
  }
  return new Promise((resolve, reject) => {
    window.hive_keychain.requestBroadcast(
      account,
      operations,
      authority,
      (response) => {
        if (!response.success) {
          reject(new Error(response.message || "Keychain operation cancelled"));
          return;
        }
        resolve(response.result);
      }
    );
  });
}

// src/modules/assets/hive/mutations/transfer.ts
async function transferHive(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.transfer(
      {
        from: params.from,
        to: params.to,
        amount: amountWithSymbol,
        memo: params.memo
      },
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function transferToSavingsHive(payload, auth) {
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo
  };
  const operation = ["transfer_to_savings", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_savings", params]],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function transferFromSavingsHive(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  }
  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  }
  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  }
  return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
  });
}
async function powerUpHive(payload, auth) {
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo
  };
  const operation = ["transfer_to_vesting", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_vesting", params]],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function delegateHive(payload, auth) {
  const operationPayload = {
    delegator: payload.from,
    delegatee: payload.to,
    vesting_shares: payload.amount
  };
  const operation = ["delegate_vesting_shares", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function powerDownHive(payload, auth) {
  const operationPayload = {
    account: payload.from,
    vesting_shares: payload.amount
  };
  const operation = ["withdraw_vesting", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
}
async function withdrawVestingRouteHive(payload, auth) {
  const baseParams = {
    from_account: payload.from_account,
    to_account: payload.to_account,
    percent: payload.percent,
    auto_vest: payload.auto_vest
  };
  const operation = ["set_withdraw_vesting_route", baseParams];
  if (payload.type === "key" && "key" in payload) {
    const { key, type: type2, ...params2 } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["set_withdraw_vesting_route", params2]],
      key
    );
  }
  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from_account, [operation], "Active");
  }
  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from_account, [operation], "active");
  }
  const { type, ...params } = payload;
  return hs.sendOperation(operation, { callback: `https://ecency.com/@${params.from_account}/wallet` }, () => {
  });
}
function useClaimRewards(username, auth, onSuccess) {
  const { data } = useQuery(getAccountFullQueryOptions(username));
  const queryClient = useQueryClient();
  return useBroadcastMutation(
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
        queryKey: getAccountFullQueryOptions(username).queryKey
      });
      queryClient.invalidateQueries({
        queryKey: ["ecency-wallets", "portfolio", "v2", username]
      });
      queryClient.invalidateQueries({
        queryKey: getHiveAssetGeneralInfoQueryOptions(username).queryKey
      });
      queryClient.invalidateQueries({
        queryKey: getHbdAssetGeneralInfoQueryOptions(username).queryKey
      });
      queryClient.invalidateQueries({
        queryKey: getHivePowerAssetGeneralInfoQueryOptions(username).queryKey
      });
      ["HIVE", "HBD", "HP"].forEach((asset) => {
        queryClient.invalidateQueries({
          queryKey: ["ecency-wallets", "asset-info", username, asset]
        });
      });
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: getAccountFullQueryOptions(username).queryKey
        });
        queryClient.invalidateQueries({
          queryKey: ["ecency-wallets", "portfolio", "v2", username]
        });
        queryClient.invalidateQueries({
          queryKey: getHiveAssetGeneralInfoQueryOptions(username).queryKey
        });
        queryClient.invalidateQueries({
          queryKey: getHbdAssetGeneralInfoQueryOptions(username).queryKey
        });
        queryClient.invalidateQueries({
          queryKey: getHivePowerAssetGeneralInfoQueryOptions(username).queryKey
        });
        ["HIVE", "HBD", "HP"].forEach((asset) => {
          queryClient.invalidateQueries({
            queryKey: ["ecency-wallets", "asset-info", username, asset]
          });
        });
      }, 5e3);
    },
    auth
  );
}
async function claimInterestHive(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.sendOperations(operations, key);
  }
  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithKeychainFallback(payload.from, operations, "Active");
  }
  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, operations, "active");
  }
  return hs.sendOperations(operations, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
  });
}
async function convertHbd(payload, auth) {
  const requestid = Math.floor(Date.now() / 1e3);
  const operationPayload = {
    owner: payload.from,
    requestid,
    amount: payload.amount
  };
  const operation = ["convert", operationPayload];
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["convert", { ...params, owner: params.from, requestid }]],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {
    });
  }
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
  AssetOperation2["Convert"] = "convert";
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
async function transferSpk(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
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
var lockLarynx = async (payload, auth) => {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
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
async function powerUpLarynx(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
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
async function transferLarynx(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
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
  return queryOptions({
    queryKey: ["assets", "spk", "markets"],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const data = await getSpkMarkets();
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
  return queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallets][SPK] \u2013 username wasn't provided");
      }
      return getSpkWallet(username);
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
  return queryOptions({
    queryKey: ["assets", "larynx", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = getQueryClient().getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "spk", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = getQueryClient().getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "larynx-power", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );
      const wallet = getQueryClient().getQueryData(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = getQueryClient().getQueryData(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = getQueryClient().getQueryData(
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
function getAllHiveEngineTokensQueryOptions(account, symbol) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "all-tokens", account, symbol],
    queryFn: async () => {
      return getHiveEngineTokensMarket(account, symbol);
    }
  });
}
function formattedNumber(value, options2 = void 0) {
  let opts = {
    fractionDigits: 3,
    prefix: "",
    suffix: ""
  };
  if (options2) {
    opts = { ...opts, ...options2 };
  }
  const { fractionDigits, prefix, suffix } = opts;
  let format4 = "0,0";
  if (fractionDigits) {
    format4 += "." + "0".repeat(fractionDigits);
  }
  let out = "";
  if (prefix) out += prefix + " ";
  const av = Math.abs(parseFloat(value.toString())) < 1e-4 ? 0 : value;
  out += numeral(av).format(format4);
  if (suffix) out += " " + suffix;
  return out;
}

// src/modules/assets/hive-engine/utils/hive-engine-token.ts
var HiveEngineToken = class {
  symbol;
  name;
  icon;
  precision;
  stakingEnabled;
  delegationEnabled;
  balance;
  stake;
  stakedBalance;
  delegationsIn;
  delegationsOut;
  usdValue;
  constructor(props) {
    this.symbol = props.symbol;
    this.name = props.name || "";
    this.icon = props.icon || "";
    this.precision = props.precision || 0;
    this.stakingEnabled = props.stakingEnabled || false;
    this.delegationEnabled = props.delegationEnabled || false;
    this.balance = parseFloat(props.balance) || 0;
    this.stake = parseFloat(props.stake) || 0;
    this.delegationsIn = parseFloat(props.delegationsIn) || 0;
    this.delegationsOut = parseFloat(props.delegationsOut) || 0;
    this.stakedBalance = this.stake + this.delegationsIn - this.delegationsOut;
    this.usdValue = props.usdValue;
  }
  hasDelegations = () => {
    if (!this.delegationEnabled) {
      return false;
    }
    return this.delegationsIn > 0 && this.delegationsOut > 0;
  };
  delegations = () => {
    if (!this.hasDelegations()) {
      return "";
    }
    return `(${formattedNumber(this.stake, {
      fractionDigits: this.precision
    })} + ${formattedNumber(this.delegationsIn, {
      fractionDigits: this.precision
    })} - ${formattedNumber(this.delegationsOut, {
      fractionDigits: this.precision
    })})`;
  };
  staked = () => {
    if (!this.stakingEnabled) {
      return "-";
    }
    if (this.stakedBalance < 1e-4) {
      return this.stakedBalance.toString();
    }
    return formattedNumber(this.stakedBalance, {
      fractionDigits: this.precision
    });
  };
  balanced = () => {
    if (this.balance < 1e-4) {
      return this.balance.toString();
    }
    return formattedNumber(this.balance, { fractionDigits: this.precision });
  };
};

// src/modules/assets/hive-engine/queries/get-hive-engine-balances-with-usd-query-options.ts
function getHiveEngineBalancesWithUsdQueryOptions(account, dynamicProps, allTokens) {
  return queryOptions({
    queryKey: [
      "assets",
      "hive-engine",
      "balances-with-usd",
      account,
      dynamicProps,
      allTokens
    ],
    queryFn: async () => {
      if (!account) {
        throw new Error("[HiveEngine] No account in a balances query");
      }
      const balances = await getHiveEngineTokensBalances(account);
      const tokens = await getHiveEngineTokensMetadata(
        balances.map((t) => t.symbol)
      );
      const pricePerHive = dynamicProps ? dynamicProps.base / dynamicProps.quote : 0;
      const metrics = Array.isArray(
        allTokens
      ) ? allTokens : [];
      return balances.map((balance) => {
        const token = tokens.find((t) => t.symbol === balance.symbol);
        let tokenMetadata;
        if (token?.metadata) {
          try {
            tokenMetadata = JSON.parse(token.metadata);
          } catch {
            tokenMetadata = void 0;
          }
        }
        const metric = metrics.find((m) => m.symbol === balance.symbol);
        const lastPrice = Number(metric?.lastPrice ?? "0");
        const balanceAmount = Number(balance.balance);
        const usdValue = balance.symbol === "SWAP.HIVE" ? pricePerHive * balanceAmount : lastPrice === 0 ? 0 : Number(
          (lastPrice * pricePerHive * balanceAmount).toFixed(10)
        );
        return new HiveEngineToken({
          symbol: balance.symbol,
          name: token?.name ?? balance.symbol,
          icon: tokenMetadata?.icon ?? "",
          precision: token?.precision ?? 0,
          stakingEnabled: token?.stakingEnabled ?? false,
          delegationEnabled: token?.delegationEnabled ?? false,
          balance: balance.balance,
          stake: balance.stake,
          delegationsIn: balance.delegationsIn,
          delegationsOut: balance.delegationsOut,
          usdValue
        });
      });
    },
    enabled: !!account
  });
}
function getHiveEngineTokensMetadataQueryOptions(tokens) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "metadata-list", tokens],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensMetadata(tokens);
    }
  });
}
function getHiveEngineTokensBalancesQueryOptions(username) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "balances", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensBalances(username);
    }
  });
}
function getHiveEngineTokensMarketQueryOptions() {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "markets"],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensMarket();
    }
  });
}

// src/modules/assets/hive-engine/queries/get-hive-engine-token-general-info-query-options.ts
function getHiveEngineTokenGeneralInfoQueryOptions(username, symbol) {
  return queryOptions({
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
      const queryClient = getQueryClient();
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
  return infiniteQueryOptions({
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
      return getHiveEngineTokenTransactions(
        username,
        symbol,
        limit,
        pageParam
      );
    }
  });
}
function getHiveEngineTokensMetricsQueryOptions(symbol, interval = "daily") {
  return queryOptions({
    queryKey: ["assets", "hive-engine", symbol],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokenMetrics(symbol, interval);
    }
  });
}
function getHiveEngineUnclaimedRewardsQueryOptions(username) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "unclaimed", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    enabled: !!username,
    queryFn: async () => {
      try {
        const data = await getHiveEngineUnclaimedRewards(
          username
        );
        return Object.values(data).filter(
          ({ pending_token }) => pending_token > 0
        );
      } catch (e) {
        return [];
      }
    }
  });
}

// src/modules/assets/hive-engine/mutations/broadcast-hive-engine-operation.ts
async function broadcastHiveEngineOperation(payload, operation, auth) {
  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  }
  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  }
  throw new Error("[SDK][Wallets] \u2013 missing broadcaster");
}

// src/modules/assets/hive-engine/mutations/delegate.ts
async function delegateEngineToken(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    return broadcastHiveEngineOperation(payload, operation, auth);
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function undelegateEngineToken(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    return broadcastHiveEngineOperation(payload, operation, auth);
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function stakeEngineToken(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    return broadcastHiveEngineOperation(payload, operation, auth);
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function unstakeEngineToken(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    return broadcastHiveEngineOperation(payload, operation, auth);
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
async function transferEngineToken(payload, auth) {
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
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    return broadcastHiveEngineOperation(payload, operation, auth);
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
var ENGINE_CONTRACT_ID = "ssc-mainnet-hive";
function buildEngineOrderPayload(action, symbol, quantity, price) {
  return {
    contractName: "market",
    contractAction: action,
    contractPayload: { symbol, quantity, price }
  };
}
function buildEngineCancelPayload(type, orderId) {
  return {
    contractName: "market",
    contractAction: "cancel",
    contractPayload: { type, id: orderId }
  };
}
function buildEngineOperation(account, payload) {
  return {
    id: ENGINE_CONTRACT_ID,
    required_auths: [account],
    required_posting_auths: [],
    json: JSON.stringify(payload)
  };
}
async function broadcastEngineOperation(account, payload, options2) {
  const operation = buildEngineOperation(account, payload);
  const opTuple = ["custom_json", operation];
  switch (options2?.method) {
    case "key": {
      if (!options2.key) {
        throw new Error("[SDK][Wallets] \u2013 active key is required");
      }
      return CONFIG.hiveClient.broadcast.json(operation, options2.key);
    }
    case "keychain": {
      if (options2.auth?.broadcast) {
        return options2.auth.broadcast([opTuple], "active");
      }
      return broadcastWithKeychainFallback(account, [opTuple], "Active");
    }
    case "hiveauth": {
      if (options2.auth?.broadcast) {
        return options2.auth.broadcast([opTuple], "active");
      }
      return broadcastWithWalletHiveAuth(account, [opTuple], "active");
    }
    case "hivesigner":
      return hs.sendOperation(
        opTuple,
        { callback: `https://ecency.com/@${account}/wallet/engine` },
        () => {
        }
      );
    default:
      throw new Error("[SDK][Wallets] \u2013 broadcast method is required");
  }
}
var placeHiveEngineBuyOrder = async (account, symbol, quantity, price, options2) => broadcastEngineOperation(
  account,
  buildEngineOrderPayload("buy", symbol, quantity, price),
  options2
);
var placeHiveEngineSellOrder = async (account, symbol, quantity, price, options2) => broadcastEngineOperation(
  account,
  buildEngineOrderPayload("sell", symbol, quantity, price),
  options2
);
var cancelHiveEngineOrder = async (account, type, orderId, options2) => broadcastEngineOperation(
  account,
  buildEngineCancelPayload(type, orderId),
  options2
);
async function claimHiveEngineRewards(payload, auth) {
  const json = JSON.stringify(payload.tokens.map((symbol) => ({ symbol })));
  const operation = [
    "custom_json",
    {
      id: "scot_claim_token",
      required_auths: [],
      required_posting_auths: [payload.account],
      json
    }
  ];
  if (payload.type === "key" && "key" in payload) {
    return CONFIG.hiveClient.broadcast.sendOperations([operation], payload.key);
  }
  if (auth?.broadcast) {
    return auth.broadcast([operation], "posting");
  }
  if (auth?.postingKey) {
    const key = PrivateKey.fromString(auth.postingKey);
    return CONFIG.hiveClient.broadcast.sendOperations([operation], key);
  }
  if (auth?.accessToken) {
    const client = new hs.Client({ accessToken: auth.accessToken });
    return client.broadcast([operation]);
  }
  if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.account, [operation], "posting");
  }
  throw new Error("[SDK][Wallets] \u2013 cannot broadcast without auth context");
}
function getPointsQueryOptions(username) {
  return queryOptions({
    queryKey: ["assets", "points", username],
    queryFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Query] \u2013 username wasn`t provided"
        );
      }
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/points",
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
  return queryOptions({
    queryKey: ["assets", "points", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getPointsQueryOptions(username));
      const data = getQueryClient().getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "points", "transactions", username, type],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/point-list`,
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
function useClaimPoints(username, accessToken, onSuccess, onError) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "points-claimed"
  );
  const fetchApi = getBoundFetch();
  return useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Claim] \u2013 username wasn't provided"
        );
      }
      if (!accessToken) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Claim] \u2013 access token wasn't found"
        );
      }
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/points-claim",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code: accessToken })
        }
      );
      if (!response.ok) {
        const body = await response.text();
        if (response.status === 406) {
          try {
            return JSON.parse(body);
          } catch {
            return { message: body, code: response.status };
          }
        }
        throw new Error(
          `[SDK][Wallets][Assets][Points][Claim] \u2013 failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
      }
      return response.json();
    },
    onError,
    onSuccess: () => {
      recordActivity();
      CONFIG.queryClient.setQueryData(
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
}, auth) {
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
    return CONFIG.hiveClient.broadcast.sendOperations([op], key);
  }
  if (type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([op], "active");
    }
    throw new Error("[SDK][Wallets] \u2013 missing broadcaster");
  }
  if (type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([op], "active");
    }
    return broadcastWithWalletHiveAuth(from, [op], "active");
  }
  return hs.sendOperation(op, { callback: `https://ecency.com/@${from}/wallet` }, () => {
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
    balances = await getQueryClient().fetchQuery(
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
    metadataList = await getQueryClient().fetchQuery(
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
  return queryOptions({
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
function parseToken(rawToken) {
  if (!rawToken || typeof rawToken !== "object") {
    return void 0;
  }
  const token = rawToken;
  return {
    name: normalizeString(token.name) ?? "",
    symbol: normalizeString(token.symbol) ?? "",
    layer: normalizeString(token.layer) ?? "hive",
    balance: normalizeNumber(token.balance) ?? 0,
    fiatRate: normalizeNumber(token.fiatRate) ?? 0,
    currency: normalizeString(token.currency) ?? "usd",
    precision: normalizeNumber(token.precision) ?? 3,
    address: normalizeString(token.address),
    error: normalizeString(token.error),
    pendingRewards: normalizeNumber(token.pendingRewards),
    pendingRewardsFiat: normalizeNumber(token.pendingRewardsFiat),
    liquid: normalizeNumber(token.liquid),
    liquidFiat: normalizeNumber(token.liquidFiat),
    savings: normalizeNumber(token.savings),
    savingsFiat: normalizeNumber(token.savingsFiat),
    staked: normalizeNumber(token.staked),
    stakedFiat: normalizeNumber(token.stakedFiat),
    iconUrl: normalizeString(token.iconUrl),
    actions: token.actions ?? [],
    extraData: token.extraData ?? [],
    apr: normalizeNumber(token.apr)
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
function getVisionPortfolioQueryOptions(username, currency = "usd") {
  return queryOptions({
    queryKey: [
      "ecency-wallets",
      "portfolio",
      "v2",
      username,
      "only-enabled",
      currency
    ],
    enabled: Boolean(username),
    staleTime: 6e4,
    refetchInterval: 12e4,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallets] \u2013 username is required");
      }
      if (CONFIG.privateApiHost === void 0 || CONFIG.privateApiHost === null) {
        throw new Error(
          "[SDK][Wallets] \u2013 privateApiHost isn't configured for portfolio"
        );
      }
      const endpoint = `${CONFIG.privateApiHost}/wallet-api/portfolio-v2`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, onlyEnabled: true, currency })
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
          payload?.fiatCurrency ?? payload?.currency
        )?.toUpperCase(),
        wallets: tokens
      };
    }
  });
}

// src/modules/wallets/queries/use-get-account-wallet-list-query.ts
function normalizeAccountTokens(tokens) {
  if (Array.isArray(tokens)) {
    return tokens.filter(Boolean);
  }
  if (tokens && typeof tokens === "object") {
    return Object.values(tokens).flatMap(
      (value) => Array.isArray(value) ? value.filter(Boolean) : []
    );
  }
  return [];
}
var BASIC_TOKENS = [
  "POINTS" /* Points */,
  "HIVE" /* Hive */,
  "HP" /* HivePower */,
  "HBD" /* HiveDollar */
];
function getAccountWalletListQueryOptions(username, currency = "usd") {
  return queryOptions({
    queryKey: ["ecency-wallets", "list", username, currency],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username, currency);
      const queryClient = getQueryClient();
      const accountQuery = getAccountFullQueryOptions(username);
      let account;
      try {
        account = await queryClient.fetchQuery(accountQuery);
      } catch {
      }
      const tokenVisibility = /* @__PURE__ */ new Map();
      const accountTokens = normalizeAccountTokens(account?.profile?.tokens);
      accountTokens.forEach((token) => {
        const symbol = token.symbol?.toUpperCase?.();
        if (!symbol) {
          return;
        }
        const showValue = token?.meta?.show;
        if (typeof showValue === "boolean") {
          tokenVisibility.set(symbol, showValue);
        }
      });
      const isTokenVisible = (symbol) => {
        const normalized = symbol?.toUpperCase();
        if (!normalized) {
          return false;
        }
        if (BASIC_TOKENS.includes(normalized)) {
          return true;
        }
        return tokenVisibility.get(normalized) === true;
      };
      try {
        const portfolio = await queryClient.fetchQuery(portfolioQuery);
        const tokensFromPortfolio = portfolio.wallets.map(
          (asset) => asset.symbol
        );
        if (tokensFromPortfolio.length > 0) {
          const visibleTokens = tokensFromPortfolio.map((token) => token?.toUpperCase?.()).filter((token) => Boolean(token)).filter(isTokenVisible);
          if (visibleTokens.length > 0) {
            return Array.from(new Set(visibleTokens));
          }
        }
      } catch {
      }
      if (accountTokens.length > 0) {
        const list = [
          ...BASIC_TOKENS,
          ...accountTokens.map((token) => token.symbol).filter(isTokenVisible)
        ];
        return Array.from(new Set(list).values());
      }
      return [...BASIC_TOKENS];
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
  return queryOptions({
    queryKey: ["assets", "apt", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/apt/${encodeURIComponent(
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
  await CONFIG.queryClient.prefetchQuery(getAccountFullQueryOptions(username));
  const account = CONFIG.queryClient.getQueryData(
    getAccountFullQueryOptions(username).queryKey
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
  return queryOptions({
    queryKey: ["assets", "apt", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "APT");
      await CONFIG.queryClient.fetchQuery(
        getAptAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getAptAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e8;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("APT")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "bnb", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/bnb/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "bnb", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "BNB");
      await CONFIG.queryClient.fetchQuery(
        getBnbAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getBnbAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e18;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("BNB")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "btc", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/btc/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "btc", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "BTC");
      await CONFIG.queryClient.fetchQuery(
        getBtcAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getBtcAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e8;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("BTC")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "eth", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/eth/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "eth", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "ETH");
      await CONFIG.queryClient.fetchQuery(
        getEthAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getEthAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e18;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("ETH")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "sol", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/sol/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "sol", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "SOL");
      await CONFIG.queryClient.fetchQuery(
        getSolAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getSolAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e9;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("SOL")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "ton", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/ton/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "ton", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TON");
      await CONFIG.queryClient.fetchQuery(
        getTonAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getTonAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e9;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("TON")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  return queryOptions({
    queryKey: ["assets", "tron", "balance", address],
    queryFn: async () => {
      const baseUrl = `${CONFIG.privateApiHost}/private-api/balance/tron/${encodeURIComponent(
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
  return queryOptions({
    queryKey: ["assets", "tron", "general-info", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TRX");
      await CONFIG.queryClient.fetchQuery(
        getTronAssetBalanceQueryOptions(address)
      );
      const accountBalance = (CONFIG.queryClient.getQueryData(
        getTronAssetBalanceQueryOptions(address).queryKey
      ) ?? 0) / 1e6;
      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("TRX")
      );
      const price = CONFIG.queryClient.getQueryData(
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
  const queryClient = getQueryClient();
  const currency = options2.currency ?? "usd";
  const fetchQuery = async (queryOptions43) => {
    if (options2.refetch) {
      await queryClient.fetchQuery(queryOptions43);
    } else {
      await queryClient.prefetchQuery(queryOptions43);
    }
    return queryClient.getQueryData(queryOptions43.queryKey);
  };
  const convertPriceToUserCurrency = async (assetInfo) => {
    if (!assetInfo || currency === "usd") {
      return assetInfo;
    }
    try {
      const conversionRate = await getCurrencyRate(currency);
      return {
        ...assetInfo,
        price: assetInfo.price * conversionRate
      };
    } catch (error) {
      console.warn(`Failed to convert price from USD to ${currency}:`, error);
      return assetInfo;
    }
  };
  const portfolioQuery = getVisionPortfolioQueryOptions(username, currency);
  const getPortfolioAssetInfo = async () => {
    try {
      const portfolio = await queryClient.fetchQuery(portfolioQuery);
      const assetInfo = portfolio.wallets.find(
        (assetItem) => assetItem.symbol.toUpperCase() === asset.toUpperCase()
      );
      if (!assetInfo) return void 0;
      const parts = [];
      if (assetInfo.liquid !== void 0 && assetInfo.liquid !== null) {
        parts.push({ name: "liquid", balance: assetInfo.liquid });
      }
      if (assetInfo.staked !== void 0 && assetInfo.staked !== null && assetInfo.staked > 0) {
        parts.push({ name: "staked", balance: assetInfo.staked });
      }
      if (assetInfo.savings !== void 0 && assetInfo.savings !== null && assetInfo.savings > 0) {
        parts.push({ name: "savings", balance: assetInfo.savings });
      }
      if (assetInfo.extraData && Array.isArray(assetInfo.extraData)) {
        for (const extraItem of assetInfo.extraData) {
          if (!extraItem || typeof extraItem !== "object") continue;
          const dataKey = extraItem.dataKey;
          const value = extraItem.value;
          if (typeof value === "string") {
            const cleanValue = value.replace(/,/g, "");
            const match = cleanValue.match(/[+-]?\s*(\d+(?:\.\d+)?)/);
            if (match) {
              const numValue = Math.abs(Number.parseFloat(match[1]));
              if (dataKey === "delegated_hive_power") {
                parts.push({ name: "outgoing_delegations", balance: numValue });
              } else if (dataKey === "received_hive_power") {
                parts.push({ name: "incoming_delegations", balance: numValue });
              } else if (dataKey === "powering_down_hive_power") {
                parts.push({ name: "pending_power_down", balance: numValue });
              }
            }
          }
        }
      }
      return {
        name: assetInfo.symbol,
        title: assetInfo.name,
        price: assetInfo.fiatRate,
        accountBalance: assetInfo.balance,
        apr: assetInfo.apr?.toString(),
        layer: assetInfo.layer,
        pendingRewards: assetInfo.pendingRewards,
        parts
      };
    } catch (e) {
      return void 0;
    }
  };
  return queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset, currency],
    queryFn: async () => {
      const portfolioAssetInfo = await getPortfolioAssetInfo();
      if (portfolioAssetInfo && portfolioAssetInfo.price > 0) {
        return portfolioAssetInfo;
      }
      let assetInfo;
      if (asset === "HIVE") {
        assetInfo = await fetchQuery(getHiveAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HP") {
        assetInfo = await fetchQuery(getHivePowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HBD") {
        assetInfo = await fetchQuery(getHbdAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SPK") {
        assetInfo = await fetchQuery(getSpkAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LARYNX") {
        assetInfo = await fetchQuery(getLarynxAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LP") {
        assetInfo = await fetchQuery(getLarynxPowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "POINTS") {
        assetInfo = await fetchQuery(getPointsAssetGeneralInfoQueryOptions(username));
      } else if (asset === "APT") {
        assetInfo = await fetchQuery(getAptAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BNB") {
        assetInfo = await fetchQuery(getBnbAssetGeneralInfoQueryOptions(username));
      } else if (asset === "BTC") {
        assetInfo = await fetchQuery(getBtcAssetGeneralInfoQueryOptions(username));
      } else if (asset === "ETH") {
        assetInfo = await fetchQuery(getEthAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SOL") {
        assetInfo = await fetchQuery(getSolAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TON") {
        assetInfo = await fetchQuery(getTonAssetGeneralInfoQueryOptions(username));
      } else if (asset === "TRX") {
        assetInfo = await fetchQuery(getTronAssetGeneralInfoQueryOptions(username));
      } else {
        const balances = await queryClient.ensureQueryData(
          getHiveEngineTokensBalancesQueryOptions(username)
        );
        if (balances.some((balance) => balance.symbol === asset)) {
          assetInfo = await fetchQuery(
            getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
          );
        } else {
          throw new Error(
            "[SDK][Wallets] \u2013 has requested unrecognized asset info"
          );
        }
      }
      return await convertPriceToUserCurrency(assetInfo);
    }
  });
}
function getTokenOperationsQueryOptions(token, username, isForOwner = false, currency = "usd") {
  return queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner, currency],
    queryFn: async () => {
      const queryClient = getQueryClient();
      const normalizedToken = token.toUpperCase();
      if (!username) {
        return [];
      }
      try {
        const portfolio = await queryClient.fetchQuery(
          getVisionPortfolioQueryOptions(username, currency)
        );
        const assetEntry = portfolio.wallets.find(
          (assetItem) => assetItem.symbol.toUpperCase() === normalizedToken
        );
        if (!assetEntry) {
          return [];
        }
        const rawActions = assetEntry.actions ?? [];
        const operations = rawActions.map((action) => {
          if (typeof action === "string") return action;
          if (action && typeof action === "object") {
            const record = action;
            return record.id ?? record.code ?? record.name ?? record.action;
          }
          return void 0;
        }).filter((id) => Boolean(id)).map((id) => {
          const canonical = id.trim().toLowerCase().replace(/[\s_]+/g, "-");
          const aliasMap = {
            // Common operations
            "transfer": "transfer" /* Transfer */,
            "ecency-point-transfer": "transfer" /* Transfer */,
            "spkcc-spk-send": "transfer" /* Transfer */,
            // Savings operations
            "transfer-to-savings": "transfer-saving" /* TransferToSavings */,
            "transfer-savings": "transfer-saving" /* TransferToSavings */,
            "savings-transfer": "transfer-saving" /* TransferToSavings */,
            "withdraw-from-savings": "withdraw-saving" /* WithdrawFromSavings */,
            "transfer-from-savings": "withdraw-saving" /* WithdrawFromSavings */,
            "withdraw-savings": "withdraw-saving" /* WithdrawFromSavings */,
            "savings-withdraw": "withdraw-saving" /* WithdrawFromSavings */,
            // Vesting/Power operations
            "transfer-to-vesting": "power-up" /* PowerUp */,
            "powerup": "power-up" /* PowerUp */,
            "power-up": "power-up" /* PowerUp */,
            "withdraw-vesting": "power-down" /* PowerDown */,
            "power-down": "power-down" /* PowerDown */,
            "powerdown": "power-down" /* PowerDown */,
            // Delegation
            "delegate": "delegate" /* Delegate */,
            "delegate-vesting-shares": "delegate" /* Delegate */,
            "hp-delegate": "delegate" /* Delegate */,
            "delegate-hp": "delegate" /* Delegate */,
            "delegate-power": "delegate" /* Delegate */,
            "undelegate": "undelegate" /* Undelegate */,
            "undelegate-power": "undelegate" /* Undelegate */,
            "undelegate-token": "undelegate" /* Undelegate */,
            // Staking (Layer 2)
            "stake": "stake" /* Stake */,
            "stake-token": "stake" /* Stake */,
            "stake-power": "stake" /* Stake */,
            "unstake": "unstake" /* Unstake */,
            "unstake-token": "unstake" /* Unstake */,
            "unstake-power": "unstake" /* Unstake */,
            // Swap/Convert
            "swap": "swap" /* Swap */,
            "swap-token": "swap" /* Swap */,
            "swap-tokens": "swap" /* Swap */,
            "convert": "convert" /* Convert */,
            // Points operations
            "promote": "promote" /* Promote */,
            "promote-post": "promote" /* Promote */,
            "promote-entry": "promote" /* Promote */,
            "boost": "promote" /* Promote */,
            "gift": "gift" /* Gift */,
            "gift-points": "gift" /* Gift */,
            "points-gift": "gift" /* Gift */,
            "claim": "claim" /* Claim */,
            "claim-rewards": "claim" /* Claim */,
            "claim-points": "claim" /* Claim */,
            "buy": "buy" /* Buy */,
            "buy-points": "buy" /* Buy */,
            // Other
            "claim-interest": "claim-interest" /* ClaimInterest */,
            "withdraw-routes": "withdraw-routes" /* WithdrawRoutes */,
            "withdrawroutes": "withdraw-routes" /* WithdrawRoutes */,
            "lock": "lock" /* LockLiquidity */,
            "lock-liquidity": "lock" /* LockLiquidity */,
            "lock-liq": "lock" /* LockLiquidity */
          };
          const mapped = aliasMap[canonical];
          if (mapped) return mapped;
          const directMatch = Object.values(AssetOperation).find(
            (op) => op.toLowerCase() === canonical
          );
          return directMatch;
        }).filter((op) => Boolean(op)).filter((op, index, self) => self.indexOf(op) === index);
        const isHiveOrHbd = ["HIVE", "HBD"].includes(normalizedToken);
        const rawToken = assetEntry;
        const hasSavings = Number(rawToken.savings ?? 0) > 0;
        if (isHiveOrHbd && !hasSavings) {
          return operations.filter(
            (operation) => operation !== "withdraw-saving" /* WithdrawFromSavings */
          );
        }
        return operations;
      } catch {
        return [];
      }
    }
  });
}
function useWalletsCacheQuery(username) {
  const queryClient = useQueryClient();
  const queryKey = ["ecency-wallets", "wallets", username];
  const getCachedWallets = () => queryClient.getQueryData(queryKey);
  const createEmptyWalletMap = () => /* @__PURE__ */ new Map();
  return useQuery({
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
  const queryClient = useQueryClient();
  const createWallet = useMutation({
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
  return useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: ({ currency, address }) => fetchApi(CONFIG.privateApiHost + "/private-api/wallets-add", {
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
  return useMutation({
    mutationKey: ["ecency-wallets", "check-wallet-existence"],
    mutationFn: async ({ address, currency }) => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/wallets-exist",
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
function useUpdateAccountWithWallets(username, accessToken) {
  const fetchApi = getBoundFetch();
  return useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: async ({ tokens, hiveKeys }) => {
      const entries = Object.entries(tokens).filter(([, address]) => Boolean(address));
      if (entries.length === 0) {
        return new Response(null, { status: 204 });
      }
      const [primaryToken, primaryAddress] = entries[0] ?? ["", ""];
      if (!accessToken) {
        throw new Error(
          "[SDK][Wallets][PrivateApi][WalletsAdd] \u2013 access token wasn`t found"
        );
      }
      return fetchApi(CONFIG.privateApiHost + "/private-api/wallets-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          code: accessToken,
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
  const queryClient = useQueryClient();
  const { mutateAsync: checkWalletExistence } = private_api_exports.useCheckWalletExistence();
  return useMutation({
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
  return R.pipe(
    tokens,
    R.filter(
      ({ type, symbol }) => type === "CHAIN" || Object.values(EcencyWalletCurrency).includes(symbol)
    ),
    R.map((item) => {
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
    R.indexBy(
      (item) => item.symbol
    )
  );
}
function useSaveWalletInformationToMetadata(username, auth, options2) {
  const queryClient = useQueryClient();
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  const { mutateAsync: updateProfile } = useAccountUpdate(username, auth);
  return useMutation({
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
      const mergedChainTokens = R.pipe(
        profileChainTokens,
        R.mergeDeep(payloadChainTokens),
        R.values()
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
    ["claim-interest" /* ClaimInterest */]: claimInterestHive,
    ["convert" /* Convert */]: convertHbd
  },
  HP: {
    ["power-down" /* PowerDown */]: powerDownHive,
    ["delegate" /* Delegate */]: delegateHive,
    ["withdraw-routes" /* WithdrawRoutes */]: withdrawVestingRouteHive
  },
  POINTS: {
    ["transfer" /* Transfer */]: transferPoint,
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
  ["undelegate" /* Undelegate */]: undelegateEngineToken,
  ["claim" /* Claim */]: (payload, auth) => {
    return claimHiveEngineRewards(
      {
        account: payload.from,
        tokens: [payload.asset],
        type: payload.type,
        ...payload.type === "key" && payload.key ? { key: payload.key } : {}
      },
      auth
    );
  }
};
function useWalletOperation(username, asset, operation, auth) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    operation
  );
  return useMutation({
    mutationKey: ["ecency-wallets", asset, operation],
    mutationFn: async (payload) => {
      const operationFn = operationToFunctionMap[asset]?.[operation];
      if (operationFn) {
        return operationFn(payload, auth);
      }
      const balancesListQuery = getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesListQuery);
      const balances = getQueryClient().getQueryData(
        balancesListQuery.queryKey
      );
      const engineBalances = balances ?? [];
      if (engineBalances.some((balance) => balance.symbol === asset)) {
        const operationFn2 = engineOperationToFunctionMap[operation];
        if (operationFn2) {
          return operationFn2({ ...payload, asset }, auth);
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
          () => getQueryClient().invalidateQueries({
            queryKey: query.queryKey
          }),
          5e3
        );
      });
      setTimeout(
        () => getQueryClient().invalidateQueries({
          queryKey: ["ecency-wallets", "portfolio", "v2", username]
        }),
        4e3
      );
    }
  });
}

// src/index.ts
rememberScryptBsvVersion();

export { AssetOperation, EcencyWalletBasicTokens, EcencyWalletCurrency, private_api_exports as EcencyWalletsPrivateApi, HIVE_ACCOUNT_OPERATION_GROUPS, HIVE_OPERATION_LIST, HIVE_OPERATION_NAME_BY_ID, HIVE_OPERATION_ORDERS, HiveEngineToken, NaiMap, PointTransactionType, Symbol2 as Symbol, broadcastWithWalletHiveAuth, buildAptTx, buildEthTx, buildExternalTx, buildPsbt, buildSolTx, buildTonTx, buildTronTx, cancelHiveEngineOrder, claimHiveEngineRewards, claimInterestHive, convertHbd, decryptMemoWithAccounts, decryptMemoWithKeys, delay, delegateEngineToken, delegateHive, deriveHiveKey, deriveHiveKeys, deriveHiveMasterPasswordKey, deriveHiveMasterPasswordKeys, detectHiveKeyDerivation, encryptMemoWithAccounts, encryptMemoWithKeys, formattedNumber, getAccountWalletAssetInfoQueryOptions, getAccountWalletListQueryOptions, getAllHiveEngineTokensQueryOptions, getAllTokensListQueryOptions, getBoundFetch, getHbdAssetGeneralInfoQueryOptions, getHbdAssetTransactionsQueryOptions, getHiveAssetGeneralInfoQueryOptions, getHiveAssetMetricQueryOptions, getHiveAssetTransactionsQueryOptions, getHiveAssetWithdrawalRoutesQueryOptions, getHiveEngineBalancesWithUsdQueryOptions, getHiveEngineTokenGeneralInfoQueryOptions, getHiveEngineTokenTransactionsQueryOptions, getHiveEngineTokensBalancesQueryOptions, getHiveEngineTokensMarketQueryOptions, getHiveEngineTokensMetadataQueryOptions, getHiveEngineTokensMetricsQueryOptions, getHiveEngineUnclaimedRewardsQueryOptions, getHivePowerAssetGeneralInfoQueryOptions, getHivePowerAssetTransactionsQueryOptions, getHivePowerDelegatesInfiniteQueryOptions, getHivePowerDelegatingsQueryOptions, getLarynxAssetGeneralInfoQueryOptions, getLarynxPowerAssetGeneralInfoQueryOptions, getPointsAssetGeneralInfoQueryOptions, getPointsAssetTransactionsQueryOptions, getPointsQueryOptions, getSpkAssetGeneralInfoQueryOptions, getSpkMarketsQueryOptions, getSpkWalletQueryOptions, getTokenOperationsQueryOptions, getTokenPriceQueryOptions, getVisionPortfolioQueryOptions, getWallet, hasWalletHiveAuthBroadcast, isEmptyDate, lockLarynx, mnemonicToSeedBip39, parseAsset, placeHiveEngineBuyOrder, placeHiveEngineSellOrder, powerDownHive, powerUpHive, powerUpLarynx, registerWalletHiveAuthBroadcast, resolveHiveOperationFilters, rewardSpk, signDigest, signExternalTx, signExternalTxAndBroadcast, signTx, signTxAndBroadcast, stakeEngineToken, transferEngineToken, transferFromSavingsHive, transferHive, transferLarynx, transferPoint, transferSpk, transferToSavingsHive, undelegateEngineToken, unstakeEngineToken, useClaimPoints, useClaimRewards, useGetExternalWalletBalanceQuery, useHiveKeysQuery, useImportWallet, useSaveWalletInformationToMetadata, useSeedPhrase, useWalletCreate, useWalletOperation, useWalletsCacheQuery, vestsToHp, withdrawVestingRouteHive };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map