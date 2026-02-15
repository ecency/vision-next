import { CONFIG, getAccountFullQueryOptions, getPortfolioQueryOptions, getQueryClient, getHiveAssetGeneralInfoQueryOptions, getHivePowerAssetGeneralInfoQueryOptions, getHbdAssetGeneralInfoQueryOptions, getSpkAssetGeneralInfoQueryOptions, getLarynxAssetGeneralInfoQueryOptions, getLarynxPowerAssetGeneralInfoQueryOptions, getPointsAssetGeneralInfoQueryOptions, getHiveEngineTokensBalancesQueryOptions, getHiveEngineTokenGeneralInfoQueryOptions, AssetOperation, useAccountUpdate, EcencyAnalytics, getCurrencyRate, getHiveEngineTokensMetadataQueryOptions, buildPointTransferOp, buildSetWithdrawVestingRouteOp, buildDelegateVestingSharesOp, buildWithdrawVestingOp, buildConvertOp, buildClaimInterestOps, buildTransferFromSavingsOp, buildTransferToSavingsOp, buildTransferOp, buildTransferToVestingOp } from '@ecency/sdk';
export { AssetOperation, HIVE_ACCOUNT_OPERATION_GROUPS, HIVE_OPERATION_LIST, HIVE_OPERATION_NAME_BY_ID, HIVE_OPERATION_ORDERS, HiveEngineToken, NaiMap, PointTransactionType, Symbol, formattedNumber, getAllHiveEngineTokensQueryOptions, getHbdAssetGeneralInfoQueryOptions, getHbdAssetTransactionsQueryOptions, getHiveAssetGeneralInfoQueryOptions, getHiveAssetMetricQueryOptions, getHiveAssetTransactionsQueryOptions, getHiveAssetWithdrawalRoutesQueryOptions, getHiveEngineBalancesWithUsdQueryOptions, getHiveEngineMetrics, getHiveEngineOpenOrders, getHiveEngineOrderBook, getHiveEngineTokenGeneralInfoQueryOptions, getHiveEngineTokenTransactionsQueryOptions, getHiveEngineTokensBalancesQueryOptions, getHiveEngineTokensMarketQueryOptions, getHiveEngineTokensMetadataQueryOptions, getHiveEngineTokensMetricsQueryOptions, getHiveEngineTradeHistory, getHiveEngineUnclaimedRewardsQueryOptions, getHivePowerAssetGeneralInfoQueryOptions, getHivePowerAssetTransactionsQueryOptions, getHivePowerDelegatesInfiniteQueryOptions, getHivePowerDelegatingsQueryOptions, getLarynxAssetGeneralInfoQueryOptions, getLarynxPowerAssetGeneralInfoQueryOptions, getPointsAssetGeneralInfoQueryOptions, getPointsAssetTransactionsQueryOptions, getPointsQueryOptions, getSpkAssetGeneralInfoQueryOptions, getSpkMarketsQueryOptions, getSpkWalletQueryOptions, isEmptyDate, parseAsset, resolveHiveOperationFilters, rewardSpk, useClaimPoints, vestsToHp } from '@ecency/sdk';
import { useQuery, queryOptions, useQueryClient, useMutation } from '@tanstack/react-query';
import bip39, { mnemonicToSeedSync } from 'bip39';
import { LRUCache } from 'lru-cache';
import { BtcWallet, buildPsbt as buildPsbt$1 } from '@okxweb3/coin-bitcoin';
import { EthWallet } from '@okxweb3/coin-ethereum';
import { TrxWallet } from '@okxweb3/coin-tron';
import { TonWallet } from '@okxweb3/coin-ton';
import { SolWallet } from '@okxweb3/coin-solana';
import { AptosWallet } from '@okxweb3/coin-aptos';
import { bip32 } from '@okxweb3/crypto-lib';
import { PrivateKey } from '@hiveio/dhive';
import { cryptoUtils } from '@hiveio/dhive/lib/crypto';
import { Memo } from '@hiveio/dhive/lib/memo';
import hs from 'hivesigner';
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
if (typeof globalLike._bitcore !== "undefined") {
  if (typeof globalLike._bitcore === "object") {
    globalLike.__bitcorePreviousVersion = globalLike._bitcore;
  }
  try {
    delete globalLike._bitcore;
  } catch {
    globalLike._bitcore = void 0;
  }
}
function rememberScryptBsvVersion() {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }
  if (typeof globalLike._bitcore === "object") {
    globalLike.__bitcorePreviousVersion = globalLike._bitcore;
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

// src/modules/assets/utils/broadcast-active-operation.ts
async function broadcastActiveOperation(payload, operations, auth) {
  if (payload.type === "key" && payload.key) {
    return CONFIG.hiveClient.broadcast.sendOperations(operations, payload.key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithKeychainFallback(payload.from, operations, "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, operations, "active");
  } else {
    return hs.sendOperation(
      operations[0],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {
      }
    );
  }
}
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
function getVisionPortfolioQueryOptions(username, currency = "usd") {
  return getPortfolioQueryOptions(username, currency, true);
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
  const fetchQuery = async (queryOptions20) => {
    if (options2.refetch) {
      await queryClient.fetchQuery(queryOptions20);
    } else {
      await queryClient.prefetchQuery(queryOptions20);
    }
    return queryClient.getQueryData(queryOptions20.queryKey);
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
      if (!username || !isForOwner) {
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
            "transfer": AssetOperation.Transfer,
            "ecency-point-transfer": AssetOperation.Transfer,
            "spkcc-spk-send": AssetOperation.Transfer,
            // Savings operations
            "transfer-to-savings": AssetOperation.TransferToSavings,
            "transfer-savings": AssetOperation.TransferToSavings,
            "savings-transfer": AssetOperation.TransferToSavings,
            "withdraw-from-savings": AssetOperation.WithdrawFromSavings,
            "transfer-from-savings": AssetOperation.WithdrawFromSavings,
            "withdraw-savings": AssetOperation.WithdrawFromSavings,
            "savings-withdraw": AssetOperation.WithdrawFromSavings,
            // Vesting/Power operations
            "transfer-to-vesting": AssetOperation.PowerUp,
            "powerup": AssetOperation.PowerUp,
            "power-up": AssetOperation.PowerUp,
            "withdraw-vesting": AssetOperation.PowerDown,
            "power-down": AssetOperation.PowerDown,
            "powerdown": AssetOperation.PowerDown,
            // Delegation
            "delegate": AssetOperation.Delegate,
            "delegate-vesting-shares": AssetOperation.Delegate,
            "hp-delegate": AssetOperation.Delegate,
            "delegate-hp": AssetOperation.Delegate,
            "delegate-power": AssetOperation.Delegate,
            "undelegate": AssetOperation.Undelegate,
            "undelegate-power": AssetOperation.Undelegate,
            "undelegate-token": AssetOperation.Undelegate,
            // Staking (Layer 2)
            "stake": AssetOperation.Stake,
            "stake-token": AssetOperation.Stake,
            "stake-power": AssetOperation.Stake,
            "unstake": AssetOperation.Unstake,
            "unstake-token": AssetOperation.Unstake,
            "unstake-power": AssetOperation.Unstake,
            // Swap/Convert
            "swap": AssetOperation.Swap,
            "swap-token": AssetOperation.Swap,
            "swap-tokens": AssetOperation.Swap,
            "convert": AssetOperation.Convert,
            // Points operations
            "promote": AssetOperation.Promote,
            "promote-post": AssetOperation.Promote,
            "promote-entry": AssetOperation.Promote,
            "boost": AssetOperation.Promote,
            "gift": AssetOperation.Gift,
            "gift-points": AssetOperation.Gift,
            "points-gift": AssetOperation.Gift,
            "claim": AssetOperation.Claim,
            "claim-rewards": AssetOperation.Claim,
            "claim-points": AssetOperation.Claim,
            "buy": AssetOperation.Buy,
            "buy-points": AssetOperation.Buy,
            // Other
            "claim-interest": AssetOperation.ClaimInterest,
            "withdraw-routes": AssetOperation.WithdrawRoutes,
            "withdrawroutes": AssetOperation.WithdrawRoutes,
            "lock": AssetOperation.LockLiquidity,
            "lock-liquidity": AssetOperation.LockLiquidity,
            "lock-liq": AssetOperation.LockLiquidity
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
            (operation) => operation !== AssetOperation.WithdrawFromSavings
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
function useWalletCreate(username, currency, importedSeed) {
  const { data: generatedMnemonic } = useSeedPhrase(username);
  const queryClient = useQueryClient();
  const createWallet = useMutation({
    mutationKey: ["ecency-wallets", "create-wallet", username, currency],
    mutationFn: async () => {
      const mnemonic = importedSeed || generatedMnemonic;
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
function buildSpkCustomJsonOp(from, id, amount) {
  return ["custom_json", {
    id,
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ amount: amount * 1e3 })
  }];
}
function buildEngineOp(from, contractAction, contractPayload, contractName = "tokens") {
  return ["custom_json", {
    id: "ssc-mainnet-hive",
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ contractName, contractAction, contractPayload })
  }];
}
function buildEngineClaimOp(account, tokens) {
  return ["custom_json", {
    id: "scot_claim_token",
    required_auths: [],
    required_posting_auths: [account],
    json: JSON.stringify(tokens.map((symbol) => ({ symbol })))
  }];
}
function buildHiveOperation(asset, operation, payload) {
  const { from, to, amount, memo } = payload;
  const requestId = Date.now() >>> 0;
  switch (asset) {
    case "HIVE":
      switch (operation) {
        case AssetOperation.Transfer:
          return [buildTransferOp(from, to, amount, memo)];
        case AssetOperation.TransferToSavings:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case AssetOperation.WithdrawFromSavings:
          return [buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case AssetOperation.PowerUp:
          return [buildTransferToVestingOp(from, to, amount)];
      }
      break;
    case "HBD":
      switch (operation) {
        case AssetOperation.Transfer:
          return [buildTransferOp(from, to, amount, memo)];
        case AssetOperation.TransferToSavings:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case AssetOperation.WithdrawFromSavings:
          return [buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case AssetOperation.ClaimInterest:
          return buildClaimInterestOps(from, to, amount, memo, payload.request_id ?? requestId);
        case AssetOperation.Convert:
          return [buildConvertOp(from, amount, Math.floor(Date.now() / 1e3))];
      }
      break;
    case "HP":
      switch (operation) {
        case AssetOperation.PowerDown:
          return [buildWithdrawVestingOp(from, amount)];
        case AssetOperation.Delegate:
          return [buildDelegateVestingSharesOp(from, to, amount)];
        case AssetOperation.WithdrawRoutes:
          return [buildSetWithdrawVestingRouteOp(
            payload.from_account ?? from,
            payload.to_account ?? to,
            payload.percent ?? 0,
            payload.auto_vest ?? false
          )];
      }
      break;
    case "POINTS":
      if (operation === AssetOperation.Transfer || operation === AssetOperation.Gift) {
        return [buildPointTransferOp(from, to, amount, memo)];
      }
      break;
    case "SPK":
      if (operation === AssetOperation.Transfer) {
        const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1e3;
        return [["custom_json", {
          id: "spkcc_spk_send",
          required_auths: [from],
          required_posting_auths: [],
          json: JSON.stringify({ to, amount: numAmount, token: "SPK" })
        }]];
      }
      break;
    case "LARYNX":
      switch (operation) {
        case AssetOperation.Transfer: {
          const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1e3;
          return [["custom_json", {
            id: "spkcc_send",
            required_auths: [from],
            required_posting_auths: [],
            json: JSON.stringify({ to, amount: numAmount })
          }]];
        }
        case AssetOperation.LockLiquidity: {
          const parsedAmount = typeof payload.amount === "string" ? parseFloat(payload.amount) : payload.amount;
          const id = payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down";
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
        case AssetOperation.PowerUp: {
          const parsedAmount = typeof payload.amount === "string" ? parseFloat(payload.amount) : payload.amount;
          const id = `spkcc_power_${payload.mode ?? "up"}`;
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
      }
      break;
  }
  return null;
}
function buildEngineOperation(asset, operation, payload) {
  const { from, to, amount } = payload;
  const quantity = typeof amount === "string" && amount.includes(" ") ? amount.split(" ")[0] : String(amount);
  switch (operation) {
    case AssetOperation.Transfer:
      return [buildEngineOp(from, "transfer", {
        symbol: asset,
        to,
        quantity,
        memo: payload.memo ?? ""
      })];
    case AssetOperation.Stake:
      return [buildEngineOp(from, "stake", { symbol: asset, to, quantity })];
    case AssetOperation.Unstake:
      return [buildEngineOp(from, "unstake", { symbol: asset, to, quantity })];
    case AssetOperation.Delegate:
      return [buildEngineOp(from, "delegate", { symbol: asset, to, quantity })];
    case AssetOperation.Undelegate:
      return [buildEngineOp(from, "undelegate", { symbol: asset, from: to, quantity })];
    case AssetOperation.Claim:
      return [buildEngineClaimOp(from, [asset])];
  }
  return null;
}
function useWalletOperation(username, asset, operation, auth) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    operation
  );
  return useMutation({
    mutationKey: ["ecency-wallets", asset, operation],
    mutationFn: async (payload) => {
      const ops = buildHiveOperation(asset, operation, payload);
      if (ops) {
        return broadcastActiveOperation(
          payload,
          ops,
          auth
        );
      }
      const balancesListQuery = getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesListQuery);
      const balances = getQueryClient().getQueryData(
        balancesListQuery.queryKey
      );
      const engineBalances = balances ?? [];
      if (engineBalances.some((balance) => balance.symbol === asset)) {
        const engineOps = buildEngineOperation(asset, operation, payload);
        if (engineOps) {
          if (operation === AssetOperation.Claim) {
            return broadcastActiveOperation(
              payload,
              engineOps,
              auth
            );
          }
          return broadcastActiveOperation(
            payload,
            engineOps,
            auth
          );
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
      if (asset === "LARYNX" && operation === AssetOperation.PowerUp) {
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

export { EcencyWalletBasicTokens, EcencyWalletCurrency, private_api_exports as EcencyWalletsPrivateApi, broadcastActiveOperation, broadcastWithWalletHiveAuth, buildAptTx, buildEthTx, buildExternalTx, buildPsbt, buildSolTx, buildTonTx, buildTronTx, decryptMemoWithAccounts, decryptMemoWithKeys, delay, deriveHiveKey, deriveHiveKeys, deriveHiveMasterPasswordKey, deriveHiveMasterPasswordKeys, detectHiveKeyDerivation, encryptMemoWithAccounts, encryptMemoWithKeys, getAccountWalletAssetInfoQueryOptions, getAccountWalletListQueryOptions, getAllTokensListQueryOptions, getBoundFetch, getTokenOperationsQueryOptions, getTokenPriceQueryOptions, getVisionPortfolioQueryOptions, getWallet, hasWalletHiveAuthBroadcast, mnemonicToSeedBip39, registerWalletHiveAuthBroadcast, signDigest, signExternalTx, signExternalTxAndBroadcast, signTx, signTxAndBroadcast, useGetExternalWalletBalanceQuery, useHiveKeysQuery, useImportWallet, useSaveWalletInformationToMetadata, useSeedPhrase, useWalletCreate, useWalletOperation, useWalletsCacheQuery };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map