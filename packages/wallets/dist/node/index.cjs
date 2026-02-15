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
    return sdk.CONFIG.hiveClient.broadcast.sendOperations(operations, payload.key);
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
    return hs__default.default.sendOperation(
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
function getVisionPortfolioQueryOptions(username, currency = "usd") {
  return sdk.getPortfolioQueryOptions(username, currency, true);
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
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "list", username, currency],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username, currency);
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
      const conversionRate = await sdk.getCurrencyRate(currency);
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
  return reactQuery.queryOptions({
    queryKey: ["ecency-wallets", "asset-info", username, asset, currency],
    queryFn: async () => {
      const portfolioAssetInfo = await getPortfolioAssetInfo();
      if (portfolioAssetInfo && portfolioAssetInfo.price > 0) {
        return portfolioAssetInfo;
      }
      let assetInfo;
      if (asset === "HIVE") {
        assetInfo = await fetchQuery(sdk.getHiveAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HP") {
        assetInfo = await fetchQuery(sdk.getHivePowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "HBD") {
        assetInfo = await fetchQuery(sdk.getHbdAssetGeneralInfoQueryOptions(username));
      } else if (asset === "SPK") {
        assetInfo = await fetchQuery(sdk.getSpkAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LARYNX") {
        assetInfo = await fetchQuery(sdk.getLarynxAssetGeneralInfoQueryOptions(username));
      } else if (asset === "LP") {
        assetInfo = await fetchQuery(sdk.getLarynxPowerAssetGeneralInfoQueryOptions(username));
      } else if (asset === "POINTS") {
        assetInfo = await fetchQuery(sdk.getPointsAssetGeneralInfoQueryOptions(username));
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
          sdk.getHiveEngineTokensBalancesQueryOptions(username)
        );
        if (balances.some((balance) => balance.symbol === asset)) {
          assetInfo = await fetchQuery(
            sdk.getHiveEngineTokenGeneralInfoQueryOptions(username, asset)
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
        case sdk.AssetOperation.Transfer:
          return [sdk.buildTransferOp(from, to, amount, memo)];
        case sdk.AssetOperation.TransferToSavings:
          return [sdk.buildTransferToSavingsOp(from, to, amount, memo)];
        case sdk.AssetOperation.WithdrawFromSavings:
          return [sdk.buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case sdk.AssetOperation.PowerUp:
          return [sdk.buildTransferToVestingOp(from, to, amount)];
      }
      break;
    case "HBD":
      switch (operation) {
        case sdk.AssetOperation.Transfer:
          return [sdk.buildTransferOp(from, to, amount, memo)];
        case sdk.AssetOperation.TransferToSavings:
          return [sdk.buildTransferToSavingsOp(from, to, amount, memo)];
        case sdk.AssetOperation.WithdrawFromSavings:
          return [sdk.buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case sdk.AssetOperation.ClaimInterest:
          return sdk.buildClaimInterestOps(from, to, amount, memo, payload.request_id ?? requestId);
        case sdk.AssetOperation.Convert:
          return [sdk.buildConvertOp(from, amount, Math.floor(Date.now() / 1e3))];
      }
      break;
    case "HP":
      switch (operation) {
        case sdk.AssetOperation.PowerDown:
          return [sdk.buildWithdrawVestingOp(from, amount)];
        case sdk.AssetOperation.Delegate:
          return [sdk.buildDelegateVestingSharesOp(from, to, amount)];
        case sdk.AssetOperation.WithdrawRoutes:
          return [sdk.buildSetWithdrawVestingRouteOp(
            payload.from_account ?? from,
            payload.to_account ?? to,
            payload.percent ?? 0,
            payload.auto_vest ?? false
          )];
      }
      break;
    case "POINTS":
      if (operation === sdk.AssetOperation.Transfer || operation === sdk.AssetOperation.Gift) {
        return [sdk.buildPointTransferOp(from, to, amount, memo)];
      }
      break;
    case "SPK":
      if (operation === sdk.AssetOperation.Transfer) {
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
        case sdk.AssetOperation.Transfer: {
          const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1e3;
          return [["custom_json", {
            id: "spkcc_send",
            required_auths: [from],
            required_posting_auths: [],
            json: JSON.stringify({ to, amount: numAmount })
          }]];
        }
        case sdk.AssetOperation.LockLiquidity: {
          const parsedAmount = typeof payload.amount === "string" ? parseFloat(payload.amount) : payload.amount;
          const id = payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down";
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
        case sdk.AssetOperation.PowerUp: {
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
    case sdk.AssetOperation.Transfer:
      return [buildEngineOp(from, "transfer", {
        symbol: asset,
        to,
        quantity,
        memo: payload.memo ?? ""
      })];
    case sdk.AssetOperation.Stake:
      return [buildEngineOp(from, "stake", { symbol: asset, to, quantity })];
    case sdk.AssetOperation.Unstake:
      return [buildEngineOp(from, "unstake", { symbol: asset, to, quantity })];
    case sdk.AssetOperation.Delegate:
      return [buildEngineOp(from, "delegate", { symbol: asset, to, quantity })];
    case sdk.AssetOperation.Undelegate:
      return [buildEngineOp(from, "undelegate", { symbol: asset, from: to, quantity })];
    case sdk.AssetOperation.Claim:
      return [buildEngineClaimOp(from, [asset])];
  }
  return null;
}
function useWalletOperation(username, asset, operation, auth) {
  const { mutateAsync: recordActivity } = sdk.EcencyAnalytics.useRecordActivity(
    username,
    operation
  );
  return reactQuery.useMutation({
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
      const balancesListQuery = sdk.getHiveEngineTokensBalancesQueryOptions(username);
      await sdk.getQueryClient().prefetchQuery(balancesListQuery);
      const balances = sdk.getQueryClient().getQueryData(
        balancesListQuery.queryKey
      );
      const engineBalances = balances ?? [];
      if (engineBalances.some((balance) => balance.symbol === asset)) {
        const engineOps = buildEngineOperation(asset, operation, payload);
        if (engineOps) {
          if (operation === sdk.AssetOperation.Claim) {
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
      if (asset === "LARYNX" && operation === sdk.AssetOperation.PowerUp) {
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
      setTimeout(
        () => sdk.getQueryClient().invalidateQueries({
          queryKey: ["ecency-wallets", "portfolio", "v2", username]
        }),
        4e3
      );
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
Object.defineProperty(exports, "getHiveEngineMetrics", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineMetrics; }
});
Object.defineProperty(exports, "getHiveEngineOpenOrders", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineOpenOrders; }
});
Object.defineProperty(exports, "getHiveEngineOrderBook", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineOrderBook; }
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
Object.defineProperty(exports, "getHiveEngineTradeHistory", {
  enumerable: true,
  get: function () { return sdk.getHiveEngineTradeHistory; }
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
Object.defineProperty(exports, "vestsToHp", {
  enumerable: true,
  get: function () { return sdk.vestsToHp; }
});
exports.EcencyWalletBasicTokens = EcencyWalletBasicTokens;
exports.EcencyWalletCurrency = EcencyWalletCurrency;
exports.EcencyWalletsPrivateApi = private_api_exports;
exports.broadcastActiveOperation = broadcastActiveOperation;
exports.broadcastWithWalletHiveAuth = broadcastWithWalletHiveAuth;
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
exports.getAccountWalletAssetInfoQueryOptions = getAccountWalletAssetInfoQueryOptions;
exports.getAccountWalletListQueryOptions = getAccountWalletListQueryOptions;
exports.getAllTokensListQueryOptions = getAllTokensListQueryOptions;
exports.getBoundFetch = getBoundFetch;
exports.getTokenOperationsQueryOptions = getTokenOperationsQueryOptions;
exports.getTokenPriceQueryOptions = getTokenPriceQueryOptions;
exports.getVisionPortfolioQueryOptions = getVisionPortfolioQueryOptions;
exports.getWallet = getWallet;
exports.hasWalletHiveAuthBroadcast = hasWalletHiveAuthBroadcast;
exports.mnemonicToSeedBip39 = mnemonicToSeedBip39;
exports.registerWalletHiveAuthBroadcast = registerWalletHiveAuthBroadcast;
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
exports.useWalletOperation = useWalletOperation;
exports.useWalletsCacheQuery = useWalletsCacheQuery;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map