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
    queryFn: async () => bip39__default.default.generateMnemonic(128),
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
      sdk.getHiveEngineTokensBalancesQueryOptions(username)
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
      sdk.getHiveEngineTokensMetadataQueryOptions(uniqueSymbols)
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
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "list", username, currency],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = sdk.getPortfolioQueryOptions(username, currency, true);
      const queryClient = sdk.getQueryClient();
      const accountQuery = sdk.getAccountFullQueryOptions(username);
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
function getTokenOperationsQueryOptions(token, username, isForOwner = false, currency = "usd") {
  return reactQuery.queryOptions({
    queryKey: ["wallets", "token-operations", token, username, isForOwner, currency],
    queryFn: async () => {
      const queryClient = sdk.getQueryClient();
      const normalizedToken = token.toUpperCase();
      if (!username || !isForOwner) {
        return [];
      }
      try {
        const portfolio = await queryClient.fetchQuery(
          sdk.getPortfolioQueryOptions(username, currency, true)
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
            "transfer": sdk.AssetOperation.Transfer,
            "ecency-point-transfer": sdk.AssetOperation.Transfer,
            "spkcc-spk-send": sdk.AssetOperation.Transfer,
            // Savings operations
            "transfer-to-savings": sdk.AssetOperation.TransferToSavings,
            "transfer-savings": sdk.AssetOperation.TransferToSavings,
            "savings-transfer": sdk.AssetOperation.TransferToSavings,
            "withdraw-from-savings": sdk.AssetOperation.WithdrawFromSavings,
            "transfer-from-savings": sdk.AssetOperation.WithdrawFromSavings,
            "withdraw-savings": sdk.AssetOperation.WithdrawFromSavings,
            "savings-withdraw": sdk.AssetOperation.WithdrawFromSavings,
            // Vesting/Power operations
            "transfer-to-vesting": sdk.AssetOperation.PowerUp,
            "powerup": sdk.AssetOperation.PowerUp,
            "power-up": sdk.AssetOperation.PowerUp,
            "withdraw-vesting": sdk.AssetOperation.PowerDown,
            "power-down": sdk.AssetOperation.PowerDown,
            "powerdown": sdk.AssetOperation.PowerDown,
            // Delegation
            "delegate": sdk.AssetOperation.Delegate,
            "delegate-vesting-shares": sdk.AssetOperation.Delegate,
            "hp-delegate": sdk.AssetOperation.Delegate,
            "delegate-hp": sdk.AssetOperation.Delegate,
            "delegate-power": sdk.AssetOperation.Delegate,
            "undelegate": sdk.AssetOperation.Undelegate,
            "undelegate-power": sdk.AssetOperation.Undelegate,
            "undelegate-token": sdk.AssetOperation.Undelegate,
            // Staking (Layer 2)
            "stake": sdk.AssetOperation.Stake,
            "stake-token": sdk.AssetOperation.Stake,
            "stake-power": sdk.AssetOperation.Stake,
            "unstake": sdk.AssetOperation.Unstake,
            "unstake-token": sdk.AssetOperation.Unstake,
            "unstake-power": sdk.AssetOperation.Unstake,
            // Swap/Convert
            "swap": sdk.AssetOperation.Swap,
            "swap-token": sdk.AssetOperation.Swap,
            "swap-tokens": sdk.AssetOperation.Swap,
            "convert": sdk.AssetOperation.Convert,
            // Points operations
            "promote": sdk.AssetOperation.Promote,
            "promote-post": sdk.AssetOperation.Promote,
            "promote-entry": sdk.AssetOperation.Promote,
            "boost": sdk.AssetOperation.Promote,
            "gift": sdk.AssetOperation.Gift,
            "gift-points": sdk.AssetOperation.Gift,
            "points-gift": sdk.AssetOperation.Gift,
            "claim": sdk.AssetOperation.Claim,
            "claim-rewards": sdk.AssetOperation.Claim,
            "claim-points": sdk.AssetOperation.Claim,
            "buy": sdk.AssetOperation.Buy,
            "buy-points": sdk.AssetOperation.Buy,
            // Other
            "claim-interest": sdk.AssetOperation.ClaimInterest,
            "withdraw-routes": sdk.AssetOperation.WithdrawRoutes,
            "withdrawroutes": sdk.AssetOperation.WithdrawRoutes,
            "lock": sdk.AssetOperation.LockLiquidity,
            "lock-liquidity": sdk.AssetOperation.LockLiquidity,
            "lock-liq": sdk.AssetOperation.LockLiquidity
          };
          const mapped = aliasMap[canonical];
          if (mapped) return mapped;
          const directMatch = Object.values(sdk.AssetOperation).find(
            (op) => op.toLowerCase() === canonical
          );
          return directMatch;
        }).filter((op) => Boolean(op)).filter((op, index, self) => self.indexOf(op) === index);
        const isHiveOrHbd = ["HIVE", "HBD"].includes(normalizedToken);
        const rawToken = assetEntry;
        const hasSavings = Number(rawToken.savings ?? 0) > 0;
        if (isHiveOrHbd && !hasSavings) {
          return operations.filter(
            (operation) => operation !== sdk.AssetOperation.WithdrawFromSavings
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
function useWalletCreate(username, currency, importedSeed) {
  const { data: generatedMnemonic } = useSeedPhrase(username);
  const queryClient = reactQuery.useQueryClient();
  const createWallet = reactQuery.useMutation({
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
function useUpdateAccountWithWallets(username, accessToken) {
  const fetchApi = getBoundFetch();
  return reactQuery.useMutation({
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
      return fetchApi(sdk.CONFIG.privateApiHost + "/private-api/wallets-add", {
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
function useSaveWalletInformationToMetadata(username, auth, options2) {
  const queryClient = reactQuery.useQueryClient();
  const { data: accountData } = reactQuery.useQuery(sdk.getAccountFullQueryOptions(username));
  const { mutateAsync: updateProfile } = sdk.useAccountUpdate(username, auth);
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

// src/index.ts
rememberScryptBsvVersion();

Object.defineProperty(exports, "AssetOperation", {
  enumerable: true,
  get: function () { return sdk.AssetOperation; }
});
Object.defineProperty(exports, "HIVE_ACCOUNT_OPERATION_GROUPS", {
  enumerable: true,
  get: function () { return sdk.HIVE_ACCOUNT_OPERATION_GROUPS; }
});
Object.defineProperty(exports, "HIVE_OPERATION_LIST", {
  enumerable: true,
  get: function () { return sdk.HIVE_OPERATION_LIST; }
});
Object.defineProperty(exports, "HIVE_OPERATION_NAME_BY_ID", {
  enumerable: true,
  get: function () { return sdk.HIVE_OPERATION_NAME_BY_ID; }
});
Object.defineProperty(exports, "HIVE_OPERATION_ORDERS", {
  enumerable: true,
  get: function () { return sdk.HIVE_OPERATION_ORDERS; }
});
Object.defineProperty(exports, "HiveEngineToken", {
  enumerable: true,
  get: function () { return sdk.HiveEngineToken; }
});
Object.defineProperty(exports, "NaiMap", {
  enumerable: true,
  get: function () { return sdk.NaiMap; }
});
Object.defineProperty(exports, "PointTransactionType", {
  enumerable: true,
  get: function () { return sdk.PointTransactionType; }
});
Object.defineProperty(exports, "Symbol", {
  enumerable: true,
  get: function () { return sdk.Symbol; }
});
Object.defineProperty(exports, "formattedNumber", {
  enumerable: true,
  get: function () { return sdk.formattedNumber; }
});
Object.defineProperty(exports, "getAccountWalletAssetInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getAccountWalletAssetInfoQueryOptions; }
});
Object.defineProperty(exports, "getAllHiveEngineTokensQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getAllHiveEngineTokensQueryOptions; }
});
Object.defineProperty(exports, "getHbdAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHbdAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getHbdAssetTransactionsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHbdAssetTransactionsQueryOptions; }
});
Object.defineProperty(exports, "getHiveAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getHiveAssetMetricQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveAssetMetricQueryOptions; }
});
Object.defineProperty(exports, "getHiveAssetTransactionsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveAssetTransactionsQueryOptions; }
});
Object.defineProperty(exports, "getHiveAssetWithdrawalRoutesQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveAssetWithdrawalRoutesQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineBalancesWithUsdQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineBalancesWithUsdQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokenGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokenGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokenTransactionsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokenTransactionsQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokensBalancesQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokensBalancesQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokensMarketQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokensMarketQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokensMetadataQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokensMetadataQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineTokensMetricsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTokensMetricsQueryOptions; }
});
Object.defineProperty(exports, "getHiveEngineUnclaimedRewardsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineUnclaimedRewardsQueryOptions; }
});
Object.defineProperty(exports, "getHivePowerAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHivePowerAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getHivePowerAssetTransactionsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHivePowerAssetTransactionsQueryOptions; }
});
Object.defineProperty(exports, "getHivePowerDelegatesInfiniteQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHivePowerDelegatesInfiniteQueryOptions; }
});
Object.defineProperty(exports, "getHivePowerDelegatingsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getHivePowerDelegatingsQueryOptions; }
});
Object.defineProperty(exports, "getLarynxAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getLarynxAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getLarynxPowerAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getLarynxPowerAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getPointsAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getPointsAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getPointsAssetTransactionsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getPointsAssetTransactionsQueryOptions; }
});
Object.defineProperty(exports, "getPointsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getPointsQueryOptions; }
});
Object.defineProperty(exports, "getSpkAssetGeneralInfoQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getSpkAssetGeneralInfoQueryOptions; }
});
Object.defineProperty(exports, "getSpkMarketsQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getSpkMarketsQueryOptions; }
});
Object.defineProperty(exports, "getSpkWalletQueryOptions", {
  enumerable: true,
  get: function () { return sdk.getSpkWalletQueryOptions; }
});
Object.defineProperty(exports, "isEmptyDate", {
  enumerable: true,
  get: function () { return sdk.isEmptyDate; }
});
Object.defineProperty(exports, "parseAsset", {
  enumerable: true,
  get: function () { return sdk.parseAsset; }
});
Object.defineProperty(exports, "resolveHiveOperationFilters", {
  enumerable: true,
  get: function () { return sdk.resolveHiveOperationFilters; }
});
Object.defineProperty(exports, "rewardSpk", {
  enumerable: true,
  get: function () { return sdk.rewardSpk; }
});
Object.defineProperty(exports, "useClaimPoints", {
  enumerable: true,
  get: function () { return sdk.useClaimPoints; }
});
Object.defineProperty(exports, "useWalletOperation", {
  enumerable: true,
  get: function () { return sdk.useWalletOperation; }
});
Object.defineProperty(exports, "vestsToHp", {
  enumerable: true,
  get: function () { return sdk.vestsToHp; }
});
exports.EcencyWalletBasicTokens = EcencyWalletBasicTokens;
exports.EcencyWalletCurrency = EcencyWalletCurrency;
exports.EcencyWalletsPrivateApi = private_api_exports;
exports.buildAptTx = buildAptTx;
exports.buildEthTx = buildEthTx;
exports.buildExternalTx = buildExternalTx;
exports.buildPsbt = buildPsbt;
exports.buildSolTx = buildSolTx;
exports.buildTonTx = buildTonTx;
exports.buildTronTx = buildTronTx;
exports.decryptMemoWithAccounts = decryptMemoWithAccounts;
exports.decryptMemoWithKeys = decryptMemoWithKeys;
exports.delay = delay;
exports.deriveHiveKey = deriveHiveKey;
exports.deriveHiveKeys = deriveHiveKeys;
exports.deriveHiveMasterPasswordKey = deriveHiveMasterPasswordKey;
exports.deriveHiveMasterPasswordKeys = deriveHiveMasterPasswordKeys;
exports.detectHiveKeyDerivation = detectHiveKeyDerivation;
exports.encryptMemoWithAccounts = encryptMemoWithAccounts;
exports.encryptMemoWithKeys = encryptMemoWithKeys;
exports.getAccountWalletListQueryOptions = getAccountWalletListQueryOptions;
exports.getAllTokensListQueryOptions = getAllTokensListQueryOptions;
exports.getBoundFetch = getBoundFetch;
exports.getTokenOperationsQueryOptions = getTokenOperationsQueryOptions;
exports.getTokenPriceQueryOptions = getTokenPriceQueryOptions;
exports.getWallet = getWallet;
exports.mnemonicToSeedBip39 = mnemonicToSeedBip39;
exports.signDigest = signDigest;
exports.signExternalTx = signExternalTx;
exports.signExternalTxAndBroadcast = signExternalTxAndBroadcast;
exports.signTx = signTx;
exports.signTxAndBroadcast = signTxAndBroadcast;
exports.useGetExternalWalletBalanceQuery = useGetExternalWalletBalanceQuery;
exports.useHiveKeysQuery = useHiveKeysQuery;
exports.useImportWallet = useImportWallet;
exports.useSaveWalletInformationToMetadata = useSaveWalletInformationToMetadata;
exports.useSeedPhrase = useSeedPhrase;
exports.useWalletCreate = useWalletCreate;
exports.useWalletsCacheQuery = useWalletsCacheQuery;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map