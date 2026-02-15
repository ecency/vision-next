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

// src/modules/core/errors/chain-errors.ts
var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["COMMON"] = "common";
  ErrorType2["INFO"] = "info";
  ErrorType2["INSUFFICIENT_RESOURCE_CREDITS"] = "insufficient_resource_credits";
  ErrorType2["MISSING_AUTHORITY"] = "missing_authority";
  ErrorType2["TOKEN_EXPIRED"] = "token_expired";
  ErrorType2["NETWORK"] = "network";
  ErrorType2["TIMEOUT"] = "timeout";
  ErrorType2["VALIDATION"] = "validation";
  return ErrorType2;
})(ErrorType || {});
function parseChainError(error) {
  const errorDescription = error?.error_description ? String(error.error_description) : "";
  const errorMessage = error?.message ? String(error.message) : "";
  const errorString = errorDescription || errorMessage || String(error || "");
  const testPattern = (pattern) => {
    if (errorDescription && pattern.test(errorDescription)) return true;
    if (errorMessage && pattern.test(errorMessage)) return true;
    if (errorString && pattern.test(errorString)) return true;
    return false;
  };
  if (testPattern(/please wait to transact/i) || testPattern(/insufficient rc/i) || testPattern(/rc mana|rc account|resource credits/i)) {
    return {
      message: "Insufficient Resource Credits. Please wait or power up.",
      type: "insufficient_resource_credits" /* INSUFFICIENT_RESOURCE_CREDITS */,
      originalError: error
    };
  }
  if (testPattern(/you may only post once every/i)) {
    return {
      message: "Please wait before posting again (minimum 3 second interval between comments).",
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  if (testPattern(/your current vote on this comment is identical/i)) {
    return {
      message: "You have already voted with the same weight.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/must claim something/i)) {
    return {
      message: "You must claim rewards before performing this action.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/cannot claim that much vests/i)) {
    return {
      message: "Cannot claim that amount. Please check your pending rewards.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/cannot delete a comment with net positive/i)) {
    return {
      message: "Cannot delete a comment with positive votes.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/children == 0/i)) {
    return {
      message: "Cannot delete a comment with replies.",
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  if (testPattern(/comment_cashout/i)) {
    return {
      message: "Cannot modify a comment that has already been paid out.",
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  if (testPattern(/votes evaluating for comment that is paid out is forbidden/i)) {
    return {
      message: "Cannot vote on posts that have already been paid out.",
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  if (testPattern(/no (active|owner|posting|memo) key available/i)) {
    return {
      message: "Key not available. Please provide your key to sign this operation.",
      type: "missing_authority" /* MISSING_AUTHORITY */,
      originalError: error
    };
  }
  if (testPattern(/missing active authority/i)) {
    return {
      message: "Missing active authority. This operation requires your active key.",
      type: "missing_authority" /* MISSING_AUTHORITY */,
      originalError: error
    };
  }
  if (testPattern(/missing owner authority/i)) {
    return {
      message: "Missing owner authority. This operation requires your owner key.",
      type: "missing_authority" /* MISSING_AUTHORITY */,
      originalError: error
    };
  }
  if (testPattern(/missing (required )?posting authority/i)) {
    return {
      message: "Missing posting authority. Please check your login method.",
      type: "missing_authority" /* MISSING_AUTHORITY */,
      originalError: error
    };
  }
  if (testPattern(/token expired/i) || testPattern(/invalid token/i)) {
    return {
      message: "Authentication token expired. Please log in again.",
      type: "token_expired" /* TOKEN_EXPIRED */,
      originalError: error
    };
  }
  if (testPattern(/has already reblogged/i) || testPattern(/already reblogged this post/i)) {
    return {
      message: "You have already reblogged this post.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/duplicate transaction/i)) {
    return {
      message: "This transaction has already been processed.",
      type: "info" /* INFO */,
      originalError: error
    };
  }
  if (testPattern(/econnrefused/i) || testPattern(/connection refused/i) || testPattern(/failed to fetch/i) || testPattern(/\bnetwork[-\s]?(request|error|timeout|unreachable|down|failed)\b/i)) {
    return {
      message: "Network error. Please check your connection and try again.",
      type: "network" /* NETWORK */,
      originalError: error
    };
  }
  if (testPattern(/timeout/i) || testPattern(/timed out/i)) {
    return {
      message: "Request timed out. Please try again.",
      type: "timeout" /* TIMEOUT */,
      originalError: error
    };
  }
  if (testPattern(/account.*does not exist/i) || testPattern(/account not found/i)) {
    return {
      message: "Account not found. Please check the username.",
      type: "validation" /* VALIDATION */,
      originalError: error
    };
  }
  if (testPattern(/invalid memo key/i)) {
    return {
      message: "Invalid memo key. Cannot encrypt message.",
      type: "validation" /* VALIDATION */,
      originalError: error
    };
  }
  if (testPattern(/(?:insufficient.*(?:funds|balance)|(?:funds|balance).*insufficient)/i)) {
    return {
      message: "Insufficient funds for this transaction.",
      type: "validation" /* VALIDATION */,
      originalError: error
    };
  }
  if (testPattern(/\b(invalid|validation)\b/i)) {
    const message2 = (error?.message || errorString).substring(0, 150) || "Validation error occurred";
    return {
      message: message2,
      type: "validation" /* VALIDATION */,
      originalError: error
    };
  }
  if (error?.error_description && typeof error.error_description === "string") {
    return {
      message: error.error_description.substring(0, 150),
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  if (error?.message && typeof error.message === "string") {
    return {
      message: error.message.substring(0, 150),
      type: "common" /* COMMON */,
      originalError: error
    };
  }
  let message;
  if (typeof error === "object" && error !== null) {
    if (error.error_description) {
      message = String(error.error_description);
    } else if (error.code) {
      message = `Error code: ${error.code}`;
    } else if (errorString && errorString !== "[object Object]") {
      message = errorString.substring(0, 150);
    } else {
      message = "Unknown error occurred";
    }
  } else {
    message = errorString.substring(0, 150) || "Unknown error occurred";
  }
  return {
    message,
    type: "common" /* COMMON */,
    originalError: error
  };
}
function formatError(error) {
  const parsed = parseChainError(error);
  return [parsed.message, parsed.type];
}
function shouldTriggerAuthFallback(error) {
  const { type } = parseChainError(error);
  return type === "missing_authority" /* MISSING_AUTHORITY */ || type === "token_expired" /* TOKEN_EXPIRED */;
}
function isResourceCreditsError(error) {
  const { type } = parseChainError(error);
  return type === "insufficient_resource_credits" /* INSUFFICIENT_RESOURCE_CREDITS */;
}
function isInfoError(error) {
  const { type } = parseChainError(error);
  return type === "info" /* INFO */;
}
function isNetworkError(error) {
  const { type } = parseChainError(error);
  return type === "network" /* NETWORK */ || type === "timeout" /* TIMEOUT */;
}
async function broadcastWithMethod(method, username, ops3, auth, authority = "posting", fetchedKey, fetchedToken) {
  const adapter = auth?.adapter;
  switch (method) {
    case "key": {
      if (!adapter) {
        throw new Error("No adapter provided for key-based auth");
      }
      let key = fetchedKey;
      if (key === void 0) {
        switch (authority) {
          case "owner":
            if (adapter.getOwnerKey) {
              key = await adapter.getOwnerKey(username);
            } else {
              throw new Error(
                `Owner key not supported by adapter. Owner operations (like account recovery) require master password login or manual key entry.`
              );
            }
            break;
          case "active":
            if (adapter.getActiveKey) {
              key = await adapter.getActiveKey(username);
            }
            break;
          case "memo":
            if (adapter.getMemoKey) {
              key = await adapter.getMemoKey(username);
            } else {
              throw new Error(
                `Memo key not supported by adapter. Use memo encryption methods instead.`
              );
            }
            break;
          case "posting":
          default:
            key = await adapter.getPostingKey(username);
            break;
        }
      }
      if (!key) {
        throw new Error(`No ${authority} key available for ${username}`);
      }
      const privateKey = dhive.PrivateKey.fromString(key);
      return await CONFIG.hiveClient.broadcast.sendOperations(ops3, privateKey);
    }
    case "hiveauth": {
      if (!adapter?.broadcastWithHiveAuth) {
        throw new Error("HiveAuth not supported by adapter");
      }
      return await adapter.broadcastWithHiveAuth(username, ops3, authority);
    }
    case "hivesigner": {
      if (!adapter) {
        throw new Error("No adapter provided for HiveSigner auth");
      }
      const token = fetchedToken !== void 0 ? fetchedToken : await adapter.getAccessToken(username);
      if (!token) {
        throw new Error(`No access token available for ${username}`);
      }
      const client = new hs__default.default.Client({ accessToken: token });
      const response = await client.broadcast(ops3);
      return response.result;
    }
    case "keychain": {
      if (!adapter?.broadcastWithKeychain) {
        throw new Error("Keychain not supported by adapter");
      }
      return await adapter.broadcastWithKeychain(username, ops3, authority);
    }
    case "custom": {
      if (!auth?.broadcast) {
        throw new Error("No custom broadcast function provided");
      }
      return await auth.broadcast(ops3, authority);
    }
    default:
      throw new Error(`Unknown auth method: ${method}`);
  }
}
async function broadcastWithFallback(username, ops3, auth, authority = "posting") {
  const adapter = auth?.adapter;
  if (adapter?.getLoginType) {
    const loginType = await adapter.getLoginType(username);
    if (loginType) {
      const hasPostingAuth = adapter.hasPostingAuthorization ? await adapter.hasPostingAuthorization(username) : false;
      if (authority === "posting" && hasPostingAuth && loginType === "key") {
        try {
          return await broadcastWithMethod("hivesigner", username, ops3, auth, authority);
        } catch (error) {
          if (!shouldTriggerAuthFallback(error)) {
            throw error;
          }
          console.warn("[SDK] HiveSigner token auth failed, falling back to key:", error);
        }
      }
      if (authority === "posting" && hasPostingAuth && loginType === "hiveauth") {
        try {
          return await broadcastWithMethod("hivesigner", username, ops3, auth, authority);
        } catch (error) {
          if (!shouldTriggerAuthFallback(error)) {
            throw error;
          }
          console.warn("[SDK] HiveSigner token auth failed, falling back to HiveAuth:", error);
        }
      }
      try {
        return await broadcastWithMethod(loginType, username, ops3, auth, authority);
      } catch (error) {
        if (shouldTriggerAuthFallback(error)) {
          if (adapter.showAuthUpgradeUI && (authority === "posting" || authority === "active")) {
            const operationName = ops3.length > 0 ? ops3[0][0] : "unknown";
            const selectedMethod = await adapter.showAuthUpgradeUI(authority, operationName);
            if (!selectedMethod) {
              throw new Error(`Operation requires ${authority} authority. User declined alternate auth.`);
            }
            return await broadcastWithMethod(selectedMethod, username, ops3, auth, authority);
          }
        }
        throw error;
      }
    }
    if (authority === "posting") {
      try {
        return await broadcastWithMethod("hivesigner", username, ops3, auth, authority);
      } catch (hsError) {
        if (shouldTriggerAuthFallback(hsError) && adapter.showAuthUpgradeUI) {
          const operationName = ops3.length > 0 ? ops3[0][0] : "unknown";
          const selectedMethod = await adapter.showAuthUpgradeUI(authority, operationName);
          if (!selectedMethod) {
            throw new Error(`No login type available for ${username}. Please log in again.`);
          }
          return await broadcastWithMethod(selectedMethod, username, ops3, auth, authority);
        }
        throw hsError;
      }
    } else if (authority === "active" && adapter.showAuthUpgradeUI) {
      const operationName = ops3.length > 0 ? ops3[0][0] : "unknown";
      const selectedMethod = await adapter.showAuthUpgradeUI(authority, operationName);
      if (!selectedMethod) {
        throw new Error(`Operation requires ${authority} authority. User declined alternate auth.`);
      }
      return await broadcastWithMethod(selectedMethod, username, ops3, auth, authority);
    }
  }
  const chain = auth?.fallbackChain ?? ["key", "hiveauth", "hivesigner", "keychain", "custom"];
  const errors = /* @__PURE__ */ new Map();
  for (const method of chain) {
    try {
      let shouldSkip = false;
      let skipReason = "";
      let prefetchedKey;
      let prefetchedToken;
      switch (method) {
        case "key":
          if (!adapter) {
            shouldSkip = true;
            skipReason = "No adapter provided";
          } else {
            let key;
            switch (authority) {
              case "owner":
                if (adapter.getOwnerKey) {
                  key = await adapter.getOwnerKey(username);
                }
                break;
              case "active":
                if (adapter.getActiveKey) {
                  key = await adapter.getActiveKey(username);
                }
                break;
              case "memo":
                if (adapter.getMemoKey) {
                  key = await adapter.getMemoKey(username);
                }
                break;
              case "posting":
              default:
                key = await adapter.getPostingKey(username);
                break;
            }
            if (!key) {
              shouldSkip = true;
              skipReason = `No ${authority} key available`;
            } else {
              prefetchedKey = key;
            }
          }
          break;
        case "hiveauth":
          if (!adapter?.broadcastWithHiveAuth) {
            shouldSkip = true;
            skipReason = "HiveAuth not supported by adapter";
          }
          break;
        case "hivesigner":
          if (!adapter) {
            shouldSkip = true;
            skipReason = "No adapter provided";
          } else {
            const token = await adapter.getAccessToken(username);
            if (!token) {
              shouldSkip = true;
              skipReason = "No access token available";
            } else {
              prefetchedToken = token;
            }
          }
          break;
        case "keychain":
          if (!adapter?.broadcastWithKeychain) {
            shouldSkip = true;
            skipReason = "Keychain not supported by adapter";
          }
          break;
        case "custom":
          if (!auth?.broadcast) {
            shouldSkip = true;
            skipReason = "No custom broadcast function provided";
          }
          break;
      }
      if (shouldSkip) {
        errors.set(method, new Error(`Skipped: ${skipReason}`));
        continue;
      }
      return await broadcastWithMethod(method, username, ops3, auth, authority, prefetchedKey, prefetchedToken);
    } catch (error) {
      errors.set(method, error);
      if (!shouldTriggerAuthFallback(error)) {
        throw error;
      }
    }
  }
  const hasRealAttempts = Array.from(errors.values()).some(
    (error) => !error.message.startsWith("Skipped:")
  );
  if (!hasRealAttempts) {
    const skipReasons = Array.from(errors.entries()).map(([method, error]) => `${method}: ${error.message}`).join(", ");
    throw new Error(
      `[SDK][Broadcast] No auth methods attempted for ${username}. ${skipReasons}`
    );
  }
  const errorMessages = Array.from(errors.entries()).map(([method, error]) => `${method}: ${error.message}`).join(", ");
  throw new Error(
    `[SDK][Broadcast] All auth methods failed for ${username}. Errors: ${errorMessages}`
  );
}
function useBroadcastMutation(mutationKey = [], username, operations, onSuccess = () => {
}, auth, authority = "posting", options) {
  return reactQuery.useMutation({
    onSuccess,
    onMutate: options?.onMutate,
    onError: options?.onError,
    onSettled: options?.onSettled,
    mutationKey: [...mutationKey, username],
    mutationFn: async (payload) => {
      if (!username) {
        throw new Error(
          "[Core][Broadcast] Attempted to call broadcast API with anon user"
        );
      }
      const ops3 = operations(payload);
      if (auth?.enableFallback !== false && auth?.adapter) {
        return broadcastWithFallback(username, ops3, auth, authority);
      }
      if (auth?.broadcast) {
        return auth.broadcast(ops3, authority);
      }
      const postingKey = auth?.postingKey;
      if (postingKey) {
        if (authority !== "posting") {
          throw new Error(
            `[SDK][Broadcast] Legacy auth only supports posting authority, but '${authority}' was requested. Use AuthContextV2 with an adapter for ${authority} operations.`
          );
        }
        const privateKey = dhive.PrivateKey.fromString(postingKey);
        return CONFIG.hiveClient.broadcast.sendOperations(
          ops3,
          privateKey
        );
      }
      const accessToken = auth?.accessToken;
      if (accessToken) {
        const client = new hs__default.default.Client({ accessToken });
        const response = await client.broadcast(ops3);
        return response.result;
      }
      throw new Error(
        "[SDK][Broadcast] \u2013 cannot broadcast w/o posting key or token"
      );
    }
  });
}
var isDevelopment = (() => {
  try {
    return process.env?.NODE_ENV === "development";
  } catch {
    return false;
  }
})();
var getHeliusApiKey = () => {
  try {
    return process.env?.VITE_HELIUS_API_KEY;
  } catch {
    return void 0;
  }
};
var CONFIG = {
  privateApiHost: "https://ecency.com",
  imageHost: "https://images.ecency.com",
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
  heliusApiKey: getHeliusApiKey(),
  queryClient: new reactQuery.QueryClient(),
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
exports.ConfigManager = void 0;
((ConfigManager2) => {
  function setQueryClient(client) {
    CONFIG.queryClient = client;
  }
  ConfigManager2.setQueryClient = setQueryClient;
  function setPrivateApiHost(host) {
    CONFIG.privateApiHost = host;
  }
  ConfigManager2.setPrivateApiHost = setPrivateApiHost;
  function getValidatedBaseUrl() {
    if (CONFIG.privateApiHost) {
      return CONFIG.privateApiHost;
    }
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return "https://ecency.com";
  }
  ConfigManager2.getValidatedBaseUrl = getValidatedBaseUrl;
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
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: empty pattern`);
        }
        return null;
      }
      if (pattern.length > maxLength) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: length ${pattern.length} exceeds max ${maxLength} - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }
      const staticAnalysis = analyzeRedosRisk(pattern);
      if (!staticAnalysis.safe) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: static analysis failed (${staticAnalysis.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }
      let regex;
      try {
        regex = new RegExp(pattern);
      } catch (compileErr) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: compilation failed - pattern: ${pattern.substring(0, 50)}...`, compileErr);
        }
        return null;
      }
      const runtimeTest = testRegexPerformance(regex);
      if (!runtimeTest.safe) {
        if (isDevelopment) {
          console.warn(`[SDK] DMCA pattern rejected: runtime test failed (${runtimeTest.reason}) - pattern: ${pattern.substring(0, 50)}...`);
        }
        return null;
      }
      return regex;
    } catch (err) {
      if (isDevelopment) {
        console.warn(`[SDK] DMCA pattern rejected: unexpected error - pattern: ${pattern.substring(0, 50)}...`, err);
      }
      return null;
    }
  }
  function setDmcaLists(lists = {}) {
    const coerceList = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
    const input = lists || {};
    const resolved = {
      accounts: coerceList(input.accounts),
      tags: coerceList(input.tags),
      patterns: coerceList(input.posts)
    };
    CONFIG.dmcaAccounts = resolved.accounts;
    CONFIG.dmcaTags = resolved.tags;
    CONFIG.dmcaPatterns = resolved.patterns;
    CONFIG.dmcaTagRegexes = resolved.tags.map((pattern) => safeCompileRegex(pattern)).filter((r) => r !== null);
    CONFIG.dmcaPatternRegexes = [];
    const rejectedTagCount = resolved.tags.length - CONFIG.dmcaTagRegexes.length;
    if (!CONFIG._dmcaInitialized && isDevelopment) {
      console.log(`[SDK] DMCA configuration loaded:`);
      console.log(`  - Accounts: ${resolved.accounts.length}`);
      console.log(`  - Tag patterns: ${CONFIG.dmcaTagRegexes.length}/${resolved.tags.length} compiled (${rejectedTagCount} rejected)`);
      console.log(`  - Post patterns: ${resolved.patterns.length} (using exact string matching)`);
      if (rejectedTagCount > 0) {
        console.warn(`[SDK] ${rejectedTagCount} DMCA tag patterns were rejected due to security validation. Check warnings above for details.`);
      }
    }
    CONFIG._dmcaInitialized = true;
  }
  ConfigManager2.setDmcaLists = setDmcaLists;
})(exports.ConfigManager || (exports.ConfigManager = {}));
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
    const privateKey = dhive.PrivateKey.fromString(postingKey);
    return CONFIG.hiveClient.broadcast.json(
      jjson,
      privateKey
    );
  }
  const accessToken = auth?.accessToken;
  if (accessToken) {
    const response = await new hs__default.default.Client({
      accessToken
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

// src/modules/core/utils/pagination-helpers.ts
function isWrappedResponse(response) {
  return response && typeof response === "object" && "data" in response && "pagination" in response && Array.isArray(response.data);
}
function normalizeToWrappedResponse(response, limit) {
  if (isWrappedResponse(response)) {
    return response;
  }
  return {
    data: Array.isArray(response) ? response : [],
    pagination: {
      total: Array.isArray(response) ? response.length : 0,
      limit,
      offset: 0,
      has_next: false
    }
  };
}

// src/modules/core/utils/vests-to-hp.ts
function vestsToHp(vests, hivePerMVests) {
  return vests / 1e6 * hivePerMVests;
}

// src/modules/core/utils/is-empty-date.ts
function isEmptyDate(s) {
  if (s === void 0) {
    return true;
  }
  return parseInt(s.split("-")[0], 10) < 1980;
}

// src/modules/core/queries/get-dynamic-props-query-options.ts
function getDynamicPropsQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["core", "dynamic-props"],
    refetchInterval: 6e4,
    staleTime: 6e4,
    refetchOnMount: true,
    queryFn: async () => {
      const rawGlobalDynamic = await CONFIG.hiveClient.database.getDynamicGlobalProperties();
      const rawFeedHistory = await CONFIG.hiveClient.database.call("get_feed_history");
      const rawChainProps = await CONFIG.hiveClient.database.call("get_chain_properties");
      const rawRewardFund = await CONFIG.hiveClient.database.call("get_reward_fund", ["post"]);
      const totalVestingSharesAmount = parseAsset(rawGlobalDynamic.total_vesting_shares).amount;
      const totalVestingFundAmount = parseAsset(rawGlobalDynamic.total_vesting_fund_hive).amount;
      let hivePerMVests = 0;
      if (Number.isFinite(totalVestingSharesAmount) && totalVestingSharesAmount !== 0 && Number.isFinite(totalVestingFundAmount)) {
        hivePerMVests = totalVestingFundAmount / totalVestingSharesAmount * 1e6;
      }
      const base = parseAsset(rawFeedHistory.current_median_history.base).amount;
      const quote = parseAsset(rawFeedHistory.current_median_history.quote).amount;
      const fundRecentClaims = parseFloat(rawRewardFund.recent_claims);
      const fundRewardBalance = parseAsset(rawRewardFund.reward_balance).amount;
      const hbdPrintRate = rawGlobalDynamic.hbd_print_rate;
      const hbdInterestRate = rawGlobalDynamic.hbd_interest_rate;
      const headBlock = rawGlobalDynamic.head_block_number;
      const totalVestingFund = totalVestingFundAmount;
      const totalVestingShares = totalVestingSharesAmount;
      const virtualSupply = parseAsset(rawGlobalDynamic.virtual_supply).amount;
      const vestingRewardPercent = rawGlobalDynamic.vesting_reward_percent || 0;
      const accountCreationFee = rawChainProps.account_creation_fee;
      return {
        // Backward compatible transformed fields (camelCase, parsed)
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
        accountCreationFee,
        // Raw blockchain data (snake_case, unparsed) for direct use
        // Includes ALL fields from the blockchain responses
        raw: {
          globalDynamic: rawGlobalDynamic,
          feedHistory: rawFeedHistory,
          chainProps: rawChainProps,
          rewardFund: rawRewardFund
        }
      };
    }
  });
}
function getRewardFundQueryOptions(fundName = "post") {
  return reactQuery.queryOptions({
    queryKey: ["core", "reward-fund", fundName],
    queryFn: () => CONFIG.hiveClient.database.call("get_reward_fund", [
      fundName
    ])
  });
}
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
    queryKey: ["accounts", "follow-count", username],
    queryFn: () => CONFIG.hiveClient.database.call("get_follow_count", [
      username
    ])
  });
}
function getFollowersQueryOptions(following, startFollower, followType = "blog", limit = 100) {
  return reactQuery.queryOptions({
    queryKey: ["accounts", "followers", following, startFollower, followType, limit],
    queryFn: () => CONFIG.hiveClient.database.call("get_followers", [
      following,
      startFollower,
      followType,
      limit
    ]),
    enabled: !!following
  });
}
function getFollowingQueryOptions(follower, startFollowing, followType = "blog", limit = 100) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
function getBookmarksQueryOptions(activeUsername, code) {
  return reactQuery.queryOptions({
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
function getBookmarksInfiniteQueryOptions(activeUsername, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["accounts", "bookmarks", "infinite", activeUsername, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeUsername || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/bookmarks?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
    },
    enabled: !!activeUsername && !!code
  });
}
function getFavouritesQueryOptions(activeUsername, code) {
  return reactQuery.queryOptions({
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
function getFavouritesInfiniteQueryOptions(activeUsername, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["accounts", "favourites", "infinite", activeUsername, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeUsername || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/favorites?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
    },
    enabled: !!activeUsername && !!code
  });
}
function checkFavouriteQueryOptions(activeUsername, code, targetUsername) {
  return reactQuery.queryOptions({
    queryKey: ["accounts", "favourites", "check", activeUsername, targetUsername],
    enabled: !!activeUsername && !!code && !!targetUsername,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Favourites] \u2013 missing auth");
      }
      if (!targetUsername) {
        throw new Error("[SDK][Accounts][Favourites] \u2013 no target username");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code,
            account: targetUsername
          })
        }
      );
      if (!response.ok) {
        throw new Error(
          `[SDK][Accounts][Favourites] \u2013 favorites-check failed with status ${response.status}: ${response.statusText}`
        );
      }
      const result = await response.json();
      if (typeof result !== "boolean") {
        throw new Error(
          `[SDK][Accounts][Favourites] \u2013 favorites-check returned invalid type: expected boolean, got ${typeof result}`
        );
      }
      return result;
    }
  });
}
function getAccountRecoveriesQueryOptions(username, code) {
  return reactQuery.queryOptions({
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
function getAccountReputationsQueryOptions(query, limit = 50) {
  return reactQuery.queryOptions({
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
var ops = dhive.utils.operationOrders;
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
  return reactQuery.infiniteQueryOptions({
    queryKey: ["accounts", "transactions", username ?? "", group, limit],
    initialPageParam: -1,
    queryFn: async ({ pageParam }) => {
      if (!username) {
        return [];
      }
      let filters;
      try {
        switch (group) {
          case "transfers":
            filters = dhive.utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["transfers"]);
            break;
          case "market-orders":
            filters = dhive.utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["market-orders"]);
            break;
          case "interests":
            filters = dhive.utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["interests"]);
            break;
          case "stake-operations":
            filters = dhive.utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["stake-operations"]);
            break;
          case "rewards":
            filters = dhive.utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["rewards"]);
            break;
          default:
            filters = dhive.utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS);
        }
      } catch (error) {
        console.warn("BigInt not supported, using client-side filtering", error);
        filters = void 0;
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
    queryKey: ["accounts", "referrals", username],
    initialPageParam: { maxId: void 0 },
    queryFn: async ({ pageParam }) => {
      const { maxId } = pageParam ?? {};
      const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
      const url = new URL(`/private-api/referrals/${username}`, baseUrl);
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
function getTrendingTagsWithStatsQueryOptions(limit = 250) {
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
function getFragmentsInfiniteQueryOptions(username, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "fragments", "infinite", username, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!username || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/fragments?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code
          })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch fragments: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
    },
    enabled: !!username && !!code
  });
}
function getPromotedPostsQuery(type = "feed") {
  return reactQuery.queryOptions({
    queryKey: ["posts", "promoted", type],
    queryFn: async () => {
      const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
      const url = new URL("/private-api/promoted-entries", baseUrl);
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
  return reactQuery.queryOptions({
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
function getUserPostVoteQueryOptions(username, author, permlink) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "user-vote", username, author, permlink],
    queryFn: async () => {
      const result = await CONFIG.hiveClient.call("database_api", "list_votes", {
        start: [username, author, permlink],
        limit: 1,
        order: "by_voter_comment"
      });
      return result?.votes?.[0] || null;
    },
    enabled: !!username && !!author && !!permlink
  });
}
function getContentQueryOptions(author, permlink) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "content", author, permlink],
    enabled: !!author && !!permlink,
    queryFn: async () => CONFIG.hiveClient.call("condenser_api", "get_content", [
      author,
      permlink
    ])
  });
}
function getContentRepliesQueryOptions(author, permlink) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "content-replies", author, permlink],
    enabled: !!author && !!permlink,
    queryFn: async () => CONFIG.hiveClient.call("condenser_api", "get_content_replies", {
      author,
      permlink
    })
  });
}
function getPostHeaderQueryOptions(author, permlink) {
  return reactQuery.queryOptions({
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
  const isDmca = CONFIG.dmcaPatterns.includes(entryPath) || CONFIG.dmcaPatternRegexes.some((regex) => regex.test(entryPath));
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
    select: (data) => sortDiscussions(entry, data, order),
    // Preserve optimistic entries during refetch by using structural sharing
    // This ensures newly added comments (is_optimistic: true) aren't wiped out
    // when blockchain hasn't indexed them yet
    structuralSharing: (oldData, newData) => {
      if (!oldData || !newData) return newData;
      const optimisticEntries = oldData.filter(
        (entry2) => entry2.is_optimistic === true
      );
      const fetchedPermlinks = new Set(
        newData.map((e) => `${e.author}/${e.permlink}`)
      );
      const missingOptimistic = optimisticEntries.filter(
        (opt) => !fetchedPermlinks.has(`${opt.author}/${opt.permlink}`)
      );
      if (missingOptimistic.length > 0) {
        return [...newData, ...missingOptimistic];
      }
      return newData;
    }
  });
}
function getDiscussionQueryOptions(author, permlink, observer, enabled = true) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "discussion", author, permlink, observer || author],
    enabled: enabled && !!author && !!permlink,
    queryFn: async () => getDiscussion(author, permlink, observer)
  });
}
function getAccountPostsInfiniteQueryOptions(username, filter = "posts", limit = 20, observer = "", enabled = true) {
  return reactQuery.infiniteQueryOptions({
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
        if (CONFIG.dmcaAccounts && CONFIG.dmcaAccounts.includes(username)) return [];
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
function getRebloggedByQueryOptions(author, permlink) {
  return reactQuery.queryOptions({
    queryKey: ["posts", "reblogged-by", author ?? "", permlink ?? ""],
    queryFn: async () => {
      if (!author || !permlink) {
        return [];
      }
      const response = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_reblogged_by",
        [author, permlink]
      );
      return Array.isArray(response) ? response : [];
    },
    enabled: !!author && !!permlink
  });
}
function getSchedulesQueryOptions(activeUsername, code) {
  return reactQuery.queryOptions({
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
function getSchedulesInfiniteQueryOptions(activeUsername, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "schedules", "infinite", activeUsername, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeUsername || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/schedules?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code
          })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
    },
    enabled: !!activeUsername && !!code
  });
}
function getDraftsQueryOptions(activeUsername, code) {
  return reactQuery.queryOptions({
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
function getDraftsInfiniteQueryOptions(activeUsername, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "drafts", "infinite", activeUsername, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeUsername || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/drafts?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code
          })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
function getImagesInfiniteQueryOptions(username, code, limit = 10) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "images", "infinite", username, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!username || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false
          }
        };
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/images?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code
          })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }
      const json = await response.json();
      return normalizeToWrappedResponse(json, limit);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return void 0;
    },
    enabled: !!username && !!code
  });
}
function getCommentHistoryQueryOptions(author, permlink, onlyMeta = false) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  const queryOptions115 = getDiscussionsQueryOptions(container, "created" /* created */, true);
  const discussionItemsRaw = await CONFIG.queryClient.fetchQuery(queryOptions115);
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "waves", "by-tag", host, tag],
    initialPageParam: void 0,
    queryFn: async ({ signal }) => {
      try {
        const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/tags", baseUrl);
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
  return reactQuery.infiniteQueryOptions({
    queryKey: ["posts", "waves", "following", host, normalizedUsername ?? ""],
    enabled: Boolean(normalizedUsername),
    initialPageParam: void 0,
    queryFn: async ({ signal }) => {
      if (!normalizedUsername) {
        return [];
      }
      try {
        const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/following", baseUrl);
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
  return reactQuery.queryOptions({
    queryKey: ["posts", "waves", "trending-tags", host, hours],
    queryFn: async ({ signal }) => {
      try {
        const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
        const url = new URL("/private-api/waves/trending/tags", baseUrl);
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
    queryKey: ["accounts", "profiles", accounts, observer ?? ""],
    enabled: enabled && accounts.length > 0,
    queryFn: async () => getProfiles(accounts, observer)
  });
}

// src/modules/accounts/mutations/use-account-update.ts
function useAccountUpdate(username, auth) {
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
    async (_data, variables) => {
      queryClient.setQueryData(
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
      );
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "full", username]
        ]);
      }
    },
    auth
  );
}
function useAccountRelationsUpdate(reference, target, auth, onSuccess, onError) {
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
      if (target) {
        getQueryClient().invalidateQueries(
          getAccountFullQueryOptions(target)
        );
      }
    }
  });
}

// src/modules/operations/builders/content.ts
function buildVoteOp(voter, author, permlink, weight) {
  if (!voter || !author || !permlink) {
    throw new Error("[SDK][buildVoteOp] Missing required parameters");
  }
  if (weight < -1e4 || weight > 1e4) {
    throw new Error("[SDK][buildVoteOp] Weight must be between -10000 and 10000");
  }
  return [
    "vote",
    {
      voter,
      author,
      permlink,
      weight
    }
  ];
}
function buildCommentOp(author, permlink, parentAuthor, parentPermlink, title, body, jsonMetadata) {
  if (!author || !permlink || parentPermlink === void 0 || !body) {
    throw new Error("[SDK][buildCommentOp] Missing required parameters");
  }
  return [
    "comment",
    {
      parent_author: parentAuthor,
      parent_permlink: parentPermlink,
      author,
      permlink,
      title,
      body,
      json_metadata: JSON.stringify(jsonMetadata)
    }
  ];
}
function buildCommentOptionsOp(author, permlink, maxAcceptedPayout, percentHbd, allowVotes, allowCurationRewards, extensions) {
  if (!author || !permlink) {
    throw new Error("[SDK][buildCommentOptionsOp] Missing required parameters");
  }
  return [
    "comment_options",
    {
      author,
      permlink,
      max_accepted_payout: maxAcceptedPayout,
      percent_hbd: percentHbd,
      allow_votes: allowVotes,
      allow_curation_rewards: allowCurationRewards,
      extensions
    }
  ];
}
function buildDeleteCommentOp(author, permlink) {
  if (!author || !permlink) {
    throw new Error("[SDK][buildDeleteCommentOp] Missing required parameters");
  }
  return [
    "delete_comment",
    {
      author,
      permlink
    }
  ];
}
function buildReblogOp(account, author, permlink, deleteReblog = false) {
  if (!account || !author || !permlink) {
    throw new Error("[SDK][buildReblogOp] Missing required parameters");
  }
  const json = {
    account,
    author,
    permlink
  };
  if (deleteReblog) {
    json.delete = "delete";
  }
  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify(["reblog", json]),
      required_auths: [],
      required_posting_auths: [account]
    }
  ];
}

// src/modules/operations/builders/wallet.ts
function buildTransferOp(from, to, amount, memo) {
  if (!from || !to || !amount) {
    throw new Error("[SDK][buildTransferOp] Missing required parameters");
  }
  return [
    "transfer",
    {
      from,
      to,
      amount,
      memo: memo || ""
    }
  ];
}
function buildMultiTransferOps(from, destinations, amount, memo) {
  if (!from || !destinations || !amount) {
    throw new Error("[SDK][buildMultiTransferOps] Missing required parameters");
  }
  const destArray = destinations.trim().split(/[\s,]+/).filter(Boolean);
  return destArray.map(
    (dest) => buildTransferOp(from, dest.trim(), amount, memo)
  );
}
function buildRecurrentTransferOp(from, to, amount, memo, recurrence, executions) {
  if (!from || !to || !amount) {
    throw new Error("[SDK][buildRecurrentTransferOp] Missing required parameters");
  }
  if (recurrence < 24) {
    throw new Error("[SDK][buildRecurrentTransferOp] Recurrence must be at least 24 hours");
  }
  return [
    "recurrent_transfer",
    {
      from,
      to,
      amount,
      memo: memo || "",
      recurrence,
      executions,
      extensions: []
    }
  ];
}
function buildTransferToSavingsOp(from, to, amount, memo) {
  if (!from || !to || !amount) {
    throw new Error("[SDK][buildTransferToSavingsOp] Missing required parameters");
  }
  return [
    "transfer_to_savings",
    {
      from,
      to,
      amount,
      memo: memo || ""
    }
  ];
}
function buildTransferFromSavingsOp(from, to, amount, memo, requestId) {
  if (!from || !to || !amount || requestId === void 0) {
    throw new Error("[SDK][buildTransferFromSavingsOp] Missing required parameters");
  }
  return [
    "transfer_from_savings",
    {
      from,
      to,
      amount,
      memo: memo || "",
      request_id: requestId
    }
  ];
}
function buildCancelTransferFromSavingsOp(from, requestId) {
  if (!from || requestId === void 0) {
    throw new Error("[SDK][buildCancelTransferFromSavingsOp] Missing required parameters");
  }
  return [
    "cancel_transfer_from_savings",
    {
      from,
      request_id: requestId
    }
  ];
}
function buildClaimInterestOps(from, to, amount, memo, requestId) {
  if (!from || !to || !amount || requestId === void 0) {
    throw new Error("[SDK][buildClaimInterestOps] Missing required parameters");
  }
  return [
    buildTransferFromSavingsOp(from, to, amount, memo, requestId),
    buildCancelTransferFromSavingsOp(from, requestId)
  ];
}
function buildTransferToVestingOp(from, to, amount) {
  if (!from || !to || !amount) {
    throw new Error("[SDK][buildTransferToVestingOp] Missing required parameters");
  }
  return [
    "transfer_to_vesting",
    {
      from,
      to,
      amount
    }
  ];
}
function buildWithdrawVestingOp(account, vestingShares) {
  if (!account || !vestingShares) {
    throw new Error("[SDK][buildWithdrawVestingOp] Missing required parameters");
  }
  return [
    "withdraw_vesting",
    {
      account,
      vesting_shares: vestingShares
    }
  ];
}
function buildDelegateVestingSharesOp(delegator, delegatee, vestingShares) {
  if (!delegator || !delegatee || !vestingShares) {
    throw new Error("[SDK][buildDelegateVestingSharesOp] Missing required parameters");
  }
  return [
    "delegate_vesting_shares",
    {
      delegator,
      delegatee,
      vesting_shares: vestingShares
    }
  ];
}
function buildSetWithdrawVestingRouteOp(fromAccount, toAccount, percent, autoVest) {
  if (!fromAccount || !toAccount || percent === void 0) {
    throw new Error("[SDK][buildSetWithdrawVestingRouteOp] Missing required parameters");
  }
  if (percent < 0 || percent > 1e4) {
    throw new Error("[SDK][buildSetWithdrawVestingRouteOp] Percent must be between 0 and 10000");
  }
  return [
    "set_withdraw_vesting_route",
    {
      from_account: fromAccount,
      to_account: toAccount,
      percent,
      auto_vest: autoVest
    }
  ];
}
function buildConvertOp(owner, amount, requestId) {
  if (!owner || !amount || requestId === void 0) {
    throw new Error("[SDK][buildConvertOp] Missing required parameters");
  }
  return [
    "convert",
    {
      owner,
      amount,
      requestid: requestId
    }
  ];
}
function buildCollateralizedConvertOp(owner, amount, requestId) {
  if (!owner || !amount || requestId === void 0) {
    throw new Error("[SDK][buildCollateralizedConvertOp] Missing required parameters");
  }
  return [
    "collateralized_convert",
    {
      owner,
      amount,
      requestid: requestId
    }
  ];
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
function buildDelegateRcOp(from, delegatees, maxRc) {
  if (!from || !delegatees || maxRc === void 0) {
    throw new Error("[SDK][buildDelegateRcOp] Missing required parameters");
  }
  const delegateeArray = delegatees.includes(",") ? delegatees.split(",").map((d) => d.trim()) : [delegatees];
  return [
    "custom_json",
    {
      id: "rc",
      json: JSON.stringify([
        "delegate_rc",
        {
          from,
          delegatees: delegateeArray,
          max_rc: maxRc
        }
      ]),
      required_auths: [],
      required_posting_auths: [from]
    }
  ];
}

// src/modules/operations/builders/social.ts
function buildFollowOp(follower, following) {
  if (!follower || !following) {
    throw new Error("[SDK][buildFollowOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: ["blog"]
        }
      ]),
      required_auths: [],
      required_posting_auths: [follower]
    }
  ];
}
function buildUnfollowOp(follower, following) {
  if (!follower || !following) {
    throw new Error("[SDK][buildUnfollowOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: []
        }
      ]),
      required_auths: [],
      required_posting_auths: [follower]
    }
  ];
}
function buildIgnoreOp(follower, following) {
  if (!follower || !following) {
    throw new Error("[SDK][buildIgnoreOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "follow",
      json: JSON.stringify([
        "follow",
        {
          follower,
          following,
          what: ["ignore"]
        }
      ]),
      required_auths: [],
      required_posting_auths: [follower]
    }
  ];
}
function buildUnignoreOp(follower, following) {
  if (!follower || !following) {
    throw new Error("[SDK][buildUnignoreOp] Missing required parameters");
  }
  return buildUnfollowOp(follower, following);
}
function buildSetLastReadOps(username, date) {
  if (!username) {
    throw new Error("[SDK][buildSetLastReadOps] Missing required parameters");
  }
  const lastReadDate = date || (/* @__PURE__ */ new Date()).toISOString().split(".")[0];
  const notifyOp = [
    "custom_json",
    {
      id: "notify",
      json: JSON.stringify(["setLastRead", { date: lastReadDate }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
  const ecencyNotifyOp = [
    "custom_json",
    {
      id: "ecency_notify",
      json: JSON.stringify(["setLastRead", { date: lastReadDate }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
  return [notifyOp, ecencyNotifyOp];
}

// src/modules/operations/builders/governance.ts
function buildWitnessVoteOp(account, witness, approve) {
  if (!account || !witness || approve === void 0) {
    throw new Error("[SDK][buildWitnessVoteOp] Missing required parameters");
  }
  return [
    "account_witness_vote",
    {
      account,
      witness,
      approve
    }
  ];
}
function buildWitnessProxyOp(account, proxy) {
  if (!account || proxy === void 0) {
    throw new Error("[SDK][buildWitnessProxyOp] Missing required parameters");
  }
  return [
    "account_witness_proxy",
    {
      account,
      proxy
    }
  ];
}
function buildProposalCreateOp(creator, payload) {
  if (!creator || !payload.receiver || !payload.subject || !payload.permlink || !payload.start || !payload.end || !payload.dailyPay) {
    throw new Error("[SDK][buildProposalCreateOp] Missing required parameters");
  }
  const startDate = new Date(payload.start);
  const endDate = new Date(payload.end);
  if (startDate.toString() === "Invalid Date" || endDate.toString() === "Invalid Date") {
    throw new Error(
      "[SDK][buildProposalCreateOp] Invalid date format: start and end must be valid ISO date strings"
    );
  }
  return [
    "create_proposal",
    {
      creator,
      receiver: payload.receiver,
      start_date: payload.start,
      end_date: payload.end,
      daily_pay: payload.dailyPay,
      subject: payload.subject,
      permlink: payload.permlink,
      extensions: []
    }
  ];
}
function buildProposalVoteOp(voter, proposalIds, approve) {
  if (!voter || !proposalIds || proposalIds.length === 0 || approve === void 0) {
    throw new Error("[SDK][buildProposalVoteOp] Missing required parameters");
  }
  return [
    "update_proposal_votes",
    {
      voter,
      proposal_ids: proposalIds,
      approve,
      extensions: []
    }
  ];
}
function buildRemoveProposalOp(proposalOwner, proposalIds) {
  if (!proposalOwner || !proposalIds || proposalIds.length === 0) {
    throw new Error("[SDK][buildRemoveProposalOp] Missing required parameters");
  }
  return [
    "remove_proposal",
    {
      proposal_owner: proposalOwner,
      proposal_ids: proposalIds,
      extensions: []
    }
  ];
}
function buildUpdateProposalOp(proposalId, creator, dailyPay, subject, permlink) {
  if (proposalId === void 0 || proposalId === null || typeof proposalId !== "number" || !creator || !dailyPay || !subject || !permlink) {
    throw new Error("[SDK][buildUpdateProposalOp] Missing required parameters");
  }
  return [
    "update_proposal",
    {
      proposal_id: proposalId,
      creator,
      daily_pay: dailyPay,
      subject,
      permlink,
      extensions: []
    }
  ];
}

// src/modules/operations/builders/community.ts
function buildSubscribeOp(username, community) {
  if (!username || !community) {
    throw new Error("[SDK][buildSubscribeOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["subscribe", { community }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildUnsubscribeOp(username, community) {
  if (!username || !community) {
    throw new Error("[SDK][buildUnsubscribeOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["unsubscribe", { community }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildSetRoleOp(username, community, account, role) {
  if (!username || !community || !account || !role) {
    throw new Error("[SDK][buildSetRoleOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["setRole", { community, account, role }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildUpdateCommunityOp(username, community, props) {
  if (!username || !community || !props) {
    throw new Error("[SDK][buildUpdateCommunityOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["updateProps", { community, props }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildPinPostOp(username, community, account, permlink, pin) {
  if (!username || !community || !account || !permlink || pin === void 0) {
    throw new Error("[SDK][buildPinPostOp] Missing required parameters");
  }
  const action = pin ? "pinPost" : "unpinPost";
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, permlink }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildMutePostOp(username, community, account, permlink, notes, mute) {
  if (!username || !community || !account || !permlink || mute === void 0) {
    throw new Error("[SDK][buildMutePostOp] Missing required parameters");
  }
  const action = mute ? "mutePost" : "unmutePost";
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, permlink, notes }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildMuteUserOp(username, community, account, notes, mute) {
  if (!username || !community || !account || mute === void 0) {
    throw new Error("[SDK][buildMuteUserOp] Missing required parameters");
  }
  const action = mute ? "muteUser" : "unmuteUser";
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify([action, { community, account, notes }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}
function buildFlagPostOp(username, community, account, permlink, notes) {
  if (!username || !community || !account || !permlink) {
    throw new Error("[SDK][buildFlagPostOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "community",
      json: JSON.stringify(["flagPost", { community, account, permlink, notes }]),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}

// src/modules/operations/builders/market.ts
var BuySellTransactionType = /* @__PURE__ */ ((BuySellTransactionType2) => {
  BuySellTransactionType2["Buy"] = "buy";
  BuySellTransactionType2["Sell"] = "sell";
  return BuySellTransactionType2;
})(BuySellTransactionType || {});
var OrderIdPrefix = /* @__PURE__ */ ((OrderIdPrefix2) => {
  OrderIdPrefix2["EMPTY"] = "";
  OrderIdPrefix2["SWAP"] = "9";
  return OrderIdPrefix2;
})(OrderIdPrefix || {});
function buildLimitOrderCreateOp(owner, amountToSell, minToReceive, fillOrKill, expiration, orderId) {
  if (!owner || !amountToSell || !minToReceive || !expiration || orderId === void 0) {
    throw new Error("[SDK][buildLimitOrderCreateOp] Missing required parameters");
  }
  return [
    "limit_order_create",
    {
      owner,
      orderid: orderId,
      amount_to_sell: amountToSell,
      min_to_receive: minToReceive,
      fill_or_kill: fillOrKill,
      expiration
    }
  ];
}
function formatNumber(value, decimals = 3) {
  return value.toFixed(decimals);
}
function buildLimitOrderCreateOpWithType(owner, amountToSell, minToReceive, orderType, idPrefix = "" /* EMPTY */) {
  if (!owner || orderType === void 0 || !Number.isFinite(amountToSell) || amountToSell <= 0 || !Number.isFinite(minToReceive) || minToReceive <= 0) {
    throw new Error("[SDK][buildLimitOrderCreateOpWithType] Missing or invalid parameters");
  }
  const expiration = new Date(Date.now());
  expiration.setDate(expiration.getDate() + 27);
  const expirationStr = expiration.toISOString().split(".")[0];
  const orderId = Number(
    `${idPrefix}${Math.floor(Date.now() / 1e3).toString().slice(2)}`
  );
  const formattedAmountToSell = orderType === "buy" /* Buy */ ? `${formatNumber(amountToSell, 3)} HBD` : `${formatNumber(amountToSell, 3)} HIVE`;
  const formattedMinToReceive = orderType === "buy" /* Buy */ ? `${formatNumber(minToReceive, 3)} HIVE` : `${formatNumber(minToReceive, 3)} HBD`;
  return buildLimitOrderCreateOp(
    owner,
    formattedAmountToSell,
    formattedMinToReceive,
    false,
    expirationStr,
    orderId
  );
}
function buildLimitOrderCancelOp(owner, orderId) {
  if (!owner || orderId === void 0) {
    throw new Error("[SDK][buildLimitOrderCancelOp] Missing required parameters");
  }
  return [
    "limit_order_cancel",
    {
      owner,
      orderid: orderId
    }
  ];
}
function buildClaimRewardBalanceOp(account, rewardHive, rewardHbd, rewardVests) {
  if (!account || !rewardHive || !rewardHbd || !rewardVests) {
    throw new Error("[SDK][buildClaimRewardBalanceOp] Missing required parameters");
  }
  return [
    "claim_reward_balance",
    {
      account,
      reward_hive: rewardHive,
      reward_hbd: rewardHbd,
      reward_vests: rewardVests
    }
  ];
}

// src/modules/operations/builders/account.ts
function buildAccountUpdateOp(account, owner, active, posting, memoKey, jsonMetadata) {
  if (!account || !memoKey) {
    throw new Error("[SDK][buildAccountUpdateOp] Missing required parameters");
  }
  return [
    "account_update",
    {
      account,
      owner,
      active,
      posting,
      memo_key: memoKey,
      json_metadata: jsonMetadata
    }
  ];
}
function buildAccountUpdate2Op(account, jsonMetadata, postingJsonMetadata, extensions) {
  if (!account || postingJsonMetadata === void 0) {
    throw new Error("[SDK][buildAccountUpdate2Op] Missing required parameters");
  }
  return [
    "account_update2",
    {
      account,
      json_metadata: jsonMetadata || "",
      posting_json_metadata: postingJsonMetadata,
      extensions: extensions || []
    }
  ];
}
function buildAccountCreateOp(creator, newAccountName, keys, fee) {
  if (!creator || !newAccountName || !keys || !fee) {
    throw new Error("[SDK][buildAccountCreateOp] Missing required parameters");
  }
  const owner = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.ownerPublicKey, 1]]
  };
  const active = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.activePublicKey, 1]]
  };
  const posting = {
    weight_threshold: 1,
    account_auths: [["ecency.app", 1]],
    key_auths: [[keys.postingPublicKey, 1]]
  };
  return [
    "account_create",
    {
      creator,
      new_account_name: newAccountName,
      owner,
      active,
      posting,
      memo_key: keys.memoPublicKey,
      json_metadata: "",
      extensions: [],
      fee
    }
  ];
}
function buildCreateClaimedAccountOp(creator, newAccountName, keys) {
  if (!creator || !newAccountName || !keys) {
    throw new Error("[SDK][buildCreateClaimedAccountOp] Missing required parameters");
  }
  const owner = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.ownerPublicKey, 1]]
  };
  const active = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.activePublicKey, 1]]
  };
  const posting = {
    weight_threshold: 1,
    account_auths: [["ecency.app", 1]],
    key_auths: [[keys.postingPublicKey, 1]]
  };
  return [
    "create_claimed_account",
    {
      creator,
      new_account_name: newAccountName,
      owner,
      active,
      posting,
      memo_key: keys.memoPublicKey,
      json_metadata: "",
      extensions: []
    }
  ];
}
function buildClaimAccountOp(creator, fee) {
  if (!creator || !fee) {
    throw new Error("[SDK][buildClaimAccountOp] Missing required parameters");
  }
  return [
    "claim_account",
    {
      creator,
      fee,
      extensions: []
    }
  ];
}
function buildGrantPostingPermissionOp(account, currentPosting, grantedAccount, weightThreshold, memoKey, jsonMetadata) {
  if (!account || !currentPosting || !grantedAccount || !memoKey) {
    throw new Error("[SDK][buildGrantPostingPermissionOp] Missing required parameters");
  }
  const existingIndex = currentPosting.account_auths.findIndex(
    ([acc]) => acc === grantedAccount
  );
  const newAccountAuths = [...currentPosting.account_auths];
  if (existingIndex >= 0) {
    newAccountAuths[existingIndex] = [grantedAccount, weightThreshold];
  } else {
    newAccountAuths.push([grantedAccount, weightThreshold]);
  }
  const newPosting = {
    ...currentPosting,
    account_auths: newAccountAuths
  };
  newPosting.account_auths.sort((a, b) => a[0] > b[0] ? 1 : -1);
  return [
    "account_update",
    {
      account,
      posting: newPosting,
      memo_key: memoKey,
      json_metadata: jsonMetadata
    }
  ];
}
function buildRevokePostingPermissionOp(account, currentPosting, revokedAccount, memoKey, jsonMetadata) {
  if (!account || !currentPosting || !revokedAccount || !memoKey) {
    throw new Error("[SDK][buildRevokePostingPermissionOp] Missing required parameters");
  }
  const newPosting = {
    ...currentPosting,
    account_auths: currentPosting.account_auths.filter(
      ([acc]) => acc !== revokedAccount
    )
  };
  return [
    "account_update",
    {
      account,
      posting: newPosting,
      memo_key: memoKey,
      json_metadata: jsonMetadata
    }
  ];
}
function buildChangeRecoveryAccountOp(accountToRecover, newRecoveryAccount, extensions = []) {
  if (!accountToRecover || !newRecoveryAccount) {
    throw new Error("[SDK][buildChangeRecoveryAccountOp] Missing required parameters");
  }
  return [
    "change_recovery_account",
    {
      account_to_recover: accountToRecover,
      new_recovery_account: newRecoveryAccount,
      extensions
    }
  ];
}
function buildRequestAccountRecoveryOp(recoveryAccount, accountToRecover, newOwnerAuthority, extensions = []) {
  if (!recoveryAccount || !accountToRecover || !newOwnerAuthority) {
    throw new Error("[SDK][buildRequestAccountRecoveryOp] Missing required parameters");
  }
  return [
    "request_account_recovery",
    {
      recovery_account: recoveryAccount,
      account_to_recover: accountToRecover,
      new_owner_authority: newOwnerAuthority,
      extensions
    }
  ];
}
function buildRecoverAccountOp(accountToRecover, newOwnerAuthority, recentOwnerAuthority, extensions = []) {
  if (!accountToRecover || !newOwnerAuthority || !recentOwnerAuthority) {
    throw new Error("[SDK][buildRecoverAccountOp] Missing required parameters");
  }
  return [
    "recover_account",
    {
      account_to_recover: accountToRecover,
      new_owner_authority: newOwnerAuthority,
      recent_owner_authority: recentOwnerAuthority,
      extensions
    }
  ];
}

// src/modules/operations/builders/ecency.ts
function buildBoostOp(user, author, permlink, amount) {
  if (!user || !author || !permlink || !amount) {
    throw new Error("[SDK][buildBoostOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "ecency_boost",
      json: JSON.stringify({
        user,
        author,
        permlink,
        amount
      }),
      required_auths: [user],
      required_posting_auths: []
    }
  ];
}
function buildBoostOpWithPoints(user, author, permlink, points) {
  if (!user || !author || !permlink || !Number.isFinite(points)) {
    throw new Error("[SDK][buildBoostOpWithPoints] Missing required parameters");
  }
  return buildBoostOp(user, author, permlink, `${points.toFixed(3)} POINT`);
}
function buildBoostPlusOp(user, account, duration) {
  if (!user || !account || !Number.isFinite(duration)) {
    throw new Error("[SDK][buildBoostPlusOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "ecency_boost_plus",
      json: JSON.stringify({
        user,
        account,
        duration
      }),
      required_auths: [user],
      required_posting_auths: []
    }
  ];
}
function buildPromoteOp(user, author, permlink, duration) {
  if (!user || !author || !permlink || !Number.isFinite(duration)) {
    throw new Error("[SDK][buildPromoteOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "ecency_promote",
      json: JSON.stringify({
        user,
        author,
        permlink,
        duration
      }),
      required_auths: [user],
      required_posting_auths: []
    }
  ];
}
function buildPointTransferOp(sender, receiver, amount, memo) {
  if (!sender || !receiver || !amount) {
    throw new Error("[SDK][buildPointTransferOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "ecency_point_transfer",
      json: JSON.stringify({
        sender,
        receiver,
        amount,
        memo: memo || ""
      }),
      required_auths: [sender],
      required_posting_auths: []
    }
  ];
}
function buildMultiPointTransferOps(sender, destinations, amount, memo) {
  if (!sender || !destinations || !amount) {
    throw new Error("[SDK][buildMultiPointTransferOps] Missing required parameters");
  }
  const destArray = destinations.trim().split(/[\s,]+/).filter(Boolean);
  if (destArray.length === 0) {
    throw new Error("[SDK][buildMultiPointTransferOps] Missing valid destinations");
  }
  return destArray.map(
    (dest) => buildPointTransferOp(sender, dest.trim(), amount, memo)
  );
}
function buildCommunityRegistrationOp(name) {
  if (!name) {
    throw new Error("[SDK][buildCommunityRegistrationOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: "ecency_registration",
      json: JSON.stringify({
        name
      }),
      required_auths: [name],
      required_posting_auths: []
    }
  ];
}
function buildActiveCustomJsonOp(username, operationId, json) {
  if (!username || !operationId || !json) {
    throw new Error("[SDK][buildActiveCustomJsonOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: operationId,
      json: JSON.stringify(json),
      required_auths: [username],
      required_posting_auths: []
    }
  ];
}
function buildPostingCustomJsonOp(username, operationId, json) {
  if (!username || !operationId || !json) {
    throw new Error("[SDK][buildPostingCustomJsonOp] Missing required parameters");
  }
  return [
    "custom_json",
    {
      id: operationId,
      json: JSON.stringify(json),
      required_auths: [],
      required_posting_auths: [username]
    }
  ];
}

// src/modules/accounts/mutations/use-follow.ts
function useFollow(username, auth) {
  return useBroadcastMutation(
    ["accounts", "follow"],
    username,
    ({ following }) => [
      buildFollowOp(username, following)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "relations", username, variables.following],
          ["accounts", "full", variables.following]
        ]);
      }
    },
    auth
  );
}

// src/modules/accounts/mutations/use-unfollow.ts
function useUnfollow(username, auth) {
  return useBroadcastMutation(
    ["accounts", "unfollow"],
    username,
    ({ following }) => [
      buildUnfollowOp(username, following)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "relations", username, variables.following],
          ["accounts", "full", variables.following]
        ]);
      }
    },
    auth
  );
}
function useBookmarkAdd(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  return reactQuery.useMutation({
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
  const { data: accountData } = reactQuery.useQuery(getAccountFullQueryOptions(username));
  return reactQuery.useMutation({
    mutationKey: ["accounts", "keys-update", username],
    mutationFn: async ({
      keys,
      keepCurrent = false,
      currentKey,
      keysToRevoke = [],
      keysToRevokeByAuthority = {}
    }) => {
      if (keys.length === 0) {
        throw new Error(
          "[SDK][Update password] \u2013 no new keys provided"
        );
      }
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] \u2013 cannot update keys for anon user"
        );
      }
      const prepareAuth = (keyName) => {
        const auth = R4__namespace.clone(accountData[keyName]);
        const keysToRevokeForAuthority = keysToRevokeByAuthority[keyName] || [];
        const allKeysToRevoke = [
          ...keysToRevokeForAuthority,
          ...keysToRevokeByAuthority[keyName] === void 0 ? keysToRevoke : []
        ];
        const existingKeys = keepCurrent ? auth.key_auths.filter(([key]) => !allKeysToRevoke.includes(key.toString())) : [];
        auth.key_auths = dedupeAndSortKeyAuths(
          existingKeys,
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
          // Always use new memo key when adding new keys
          memo_key: keys[0].memo_key.createPublic().toString()
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
function useAccountRevokePosting(username, options, auth) {
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
        if (!auth?.broadcast) {
          throw new Error("[SDK][Accounts] \u2013 missing keychain broadcaster");
        }
        return auth.broadcast([["account_update", operationBody]], "active");
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
function useAccountUpdateRecovery(username, code, options, auth) {
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

// src/modules/accounts/mutations/use-claim-account.ts
function useClaimAccount(username, auth) {
  return useBroadcastMutation(
    ["accounts", "claimAccount"],
    username,
    ({ creator, fee = "0.000 HIVE" }) => [
      buildClaimAccountOp(creator, fee)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", variables.creator]
        ]);
      }
    },
    auth,
    "active"
  );
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

// src/modules/operations/authority-map.ts
var OPERATION_AUTHORITY_MAP = {
  // Posting authority operations
  vote: "posting",
  comment: "posting",
  delete_comment: "posting",
  comment_options: "posting",
  claim_reward_balance: "posting",
  // Active authority operations - Financial
  cancel_transfer_from_savings: "active",
  collateralized_convert: "active",
  convert: "active",
  delegate_vesting_shares: "active",
  recurrent_transfer: "active",
  set_withdraw_vesting_route: "active",
  transfer: "active",
  transfer_from_savings: "active",
  transfer_to_savings: "active",
  transfer_to_vesting: "active",
  withdraw_vesting: "active",
  // Active authority operations - Market
  limit_order_create: "active",
  limit_order_cancel: "active",
  // Active authority operations - Account Management
  account_update: "active",
  account_update2: "active",
  claim_account: "active",
  create_claimed_account: "active",
  // Active authority operations - Governance
  account_witness_proxy: "active",
  account_witness_vote: "active",
  remove_proposal: "active",
  update_proposal_votes: "active",
  // Owner authority operations - Security & Account Recovery
  change_recovery_account: "owner",
  request_account_recovery: "owner",
  recover_account: "owner",
  reset_account: "owner",
  set_reset_account: "owner"
  // Note: Some operations are handled separately via content inspection:
  // - custom_json: via getCustomJsonAuthority() - posting or active based on required_auths
  // - create_proposal/update_proposal: via getProposalAuthority() - typically active
};
function getCustomJsonAuthority(customJsonOp) {
  const opType = customJsonOp[0];
  const payload = customJsonOp[1];
  if (opType !== "custom_json") {
    throw new Error("Operation is not a custom_json operation");
  }
  const customJson = payload;
  if (customJson.required_auths && customJson.required_auths.length > 0) {
    return "active";
  }
  if (customJson.required_posting_auths && customJson.required_posting_auths.length > 0) {
    return "posting";
  }
  return "posting";
}
function getProposalAuthority(proposalOp) {
  const opType = proposalOp[0];
  if (opType !== "create_proposal" && opType !== "update_proposal") {
    throw new Error("Operation is not a proposal operation");
  }
  return "active";
}
function getOperationAuthority(op) {
  const opType = op[0];
  if (opType === "custom_json") {
    return getCustomJsonAuthority(op);
  }
  if (opType === "create_proposal" || opType === "update_proposal") {
    return getProposalAuthority(op);
  }
  return OPERATION_AUTHORITY_MAP[opType] ?? "posting";
}
function getRequiredAuthority(ops3) {
  let highestAuthority = "posting";
  for (const op of ops3) {
    const authority = getOperationAuthority(op);
    if (authority === "owner") {
      return "owner";
    }
    if (authority === "active" && highestAuthority === "posting") {
      highestAuthority = "active";
    }
  }
  return highestAuthority;
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
function useSignOperationByKeychain(username, auth, keyType = "active") {
  return reactQuery.useMutation({
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
function useAddFragment(username, code) {
  return reactQuery.useMutation({
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
      const queryClient = getQueryClient();
      queryClient.setQueryData(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [response, ...data ?? []]
      );
      queryClient.setQueriesData(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(
              (page, index) => index === 0 ? { ...page, data: [response, ...page.data] } : page
            )
          };
        }
      );
    }
  });
}
function useEditFragment(username, code) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "edit-fragment", username],
    mutationFn: async ({
      fragmentId,
      title,
      body
    }) => {
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
    onSuccess(response, variables) {
      const queryClient = getQueryClient();
      queryClient.setQueryData(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => {
          if (!data) {
            return [];
          }
          const index = data.findIndex(({ id }) => id === variables.fragmentId);
          if (index >= 0) {
            data[index] = response;
          }
          return [...data];
        }
      );
      queryClient.setQueriesData(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map(
                (fragment) => fragment.id === variables.fragmentId ? response : fragment
              )
            }))
          };
        }
      );
    }
  });
}
function useRemoveFragment(username, code) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "remove-fragment", username],
    mutationFn: async ({ fragmentId }) => {
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
    onSuccess(_data, variables) {
      const queryClient = getQueryClient();
      queryClient.setQueryData(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [...data ?? []].filter(({ id }) => id !== variables.fragmentId)
      );
      queryClient.setQueriesData(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((fragment) => fragment.id !== variables.fragmentId)
            }))
          };
        }
      );
    }
  });
}

// src/modules/private-api/requests.ts
async function parseJsonResponse(response) {
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
  const text = await response.text();
  if (!text || text.trim() === "") {
    return "";
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("[SDK] Failed to parse JSON response:", e, "Response:", text);
    return "";
  }
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
  const data = await parseJsonResponse(response);
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
  const data = await parseJsonResponse(response);
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
  await parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
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
  return parseJsonResponse(response);
}

// src/modules/posts/mutations/use-add-draft.ts
function useAddDraft(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "drafts", "add", username],
    mutationFn: async ({
      title,
      body,
      tags,
      meta
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for addDraft");
      }
      return addDraft(code, title, body, tags, meta);
    },
    onSuccess: (data) => {
      onSuccess?.();
      const qc = getQueryClient();
      if (data?.drafts) {
        qc.setQueryData(["posts", "drafts", username], data.drafts);
      } else {
        qc.invalidateQueries({ queryKey: ["posts", "drafts", username] });
      }
    },
    onError
  });
}
function useUpdateDraft(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "drafts", "update", username],
    mutationFn: async ({
      draftId,
      title,
      body,
      tags,
      meta
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for updateDraft");
      }
      return updateDraft(code, draftId, title, body, tags, meta);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "drafts", username]
      });
    },
    onError
  });
}
function useDeleteDraft(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "drafts", "delete", username],
    mutationFn: async ({ draftId }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for deleteDraft");
      }
      return deleteDraft(code, draftId);
    },
    onSuccess: (_data, variables) => {
      onSuccess?.();
      const qc = getQueryClient();
      qc.setQueryData(
        ["posts", "drafts", username],
        (prev) => prev?.filter((d) => d._id !== variables.draftId)
      );
    },
    onError
  });
}
function useAddSchedule(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "schedules", "add", username],
    mutationFn: async ({
      permlink,
      title,
      body,
      meta,
      options,
      schedule,
      reblog
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for addSchedule");
      }
      return addSchedule(code, permlink, title, body, meta, options, schedule, reblog);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "schedules", username]
      });
    },
    onError
  });
}
function useDeleteSchedule(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "schedules", "delete", username],
    mutationFn: async ({ id }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for deleteSchedule");
      }
      return deleteSchedule(code, id);
    },
    onSuccess: (data) => {
      onSuccess?.();
      const qc = getQueryClient();
      if (data) {
        qc.setQueryData(["posts", "schedules", username], data);
      } else {
        qc.invalidateQueries({ queryKey: ["posts", "schedules", username] });
      }
    },
    onError
  });
}
function useMoveSchedule(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "schedules", "move", username],
    mutationFn: async ({ id }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for moveSchedule");
      }
      return moveSchedule(code, id);
    },
    onSuccess: (data) => {
      onSuccess?.();
      const qc = getQueryClient();
      if (data) {
        qc.setQueryData(["posts", "schedules", username], data);
      } else {
        qc.invalidateQueries({ queryKey: ["posts", "schedules", username] });
      }
      qc.invalidateQueries({ queryKey: ["posts", "drafts", username] });
    },
    onError
  });
}
function useAddImage(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "images", "add", username],
    mutationFn: async ({ url }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for addImage");
      }
      return addImage(code, url);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "images", username]
      });
    },
    onError
  });
}
function useDeleteImage(username, code, onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "images", "delete", username],
    mutationFn: async ({ imageId }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] \u2013 missing auth for deleteImage");
      }
      return deleteImage(code, imageId);
    },
    onSuccess: (_data, variables) => {
      onSuccess?.();
      const qc = getQueryClient();
      const { imageId } = variables;
      qc.setQueryData(
        ["posts", "images", username],
        (prev) => prev?.filter((img) => img._id !== imageId)
      );
      qc.setQueriesData(
        { queryKey: ["posts", "images", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((img) => img._id !== imageId)
            }))
          };
        }
      );
    },
    onError
  });
}
function useUploadImage(onSuccess, onError) {
  return reactQuery.useMutation({
    mutationKey: ["posts", "images", "upload"],
    mutationFn: async ({
      file,
      token,
      signal
    }) => {
      return uploadImage(file, token, signal);
    },
    onSuccess,
    onError
  });
}

// src/modules/posts/cache/entries-cache-management.ts
function makeEntryPath3(author, permlink) {
  return `/@${author}/${permlink}`;
}
function getEntryFromCache(author, permlink, qc) {
  const queryClient = qc ?? getQueryClient();
  return queryClient.getQueryData([
    "posts",
    "entry",
    makeEntryPath3(author, permlink)
  ]);
}
function setEntryInCache(entry, qc) {
  const queryClient = qc ?? getQueryClient();
  queryClient.setQueryData(
    ["posts", "entry", makeEntryPath3(entry.author, entry.permlink)],
    entry
  );
}
function mutateEntry(author, permlink, updater, qc) {
  const queryClient = qc ?? getQueryClient();
  const path = makeEntryPath3(author, permlink);
  const existing = queryClient.getQueryData(["posts", "entry", path]);
  if (!existing) return void 0;
  const updated = updater(existing);
  queryClient.setQueryData(["posts", "entry", path], updated);
  return existing;
}
exports.EntriesCacheManagement = void 0;
((EntriesCacheManagement2) => {
  function updateVotes(author, permlink, votes, payout, qc) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        active_votes: votes,
        stats: {
          ...entry.stats || {
            gray: false,
            hide: false,
            flag_weight: 0,
            total_votes: 0
          },
          total_votes: votes.length,
          flag_weight: entry.stats?.flag_weight || 0
        },
        total_votes: votes.length,
        payout,
        pending_payout_value: String(payout)
      }),
      qc
    );
  }
  EntriesCacheManagement2.updateVotes = updateVotes;
  function updateReblogsCount(author, permlink, count, qc) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        reblogs: count
      }),
      qc
    );
  }
  EntriesCacheManagement2.updateReblogsCount = updateReblogsCount;
  function updateRepliesCount(author, permlink, count, qc) {
    mutateEntry(
      author,
      permlink,
      (entry) => ({
        ...entry,
        children: count
      }),
      qc
    );
  }
  EntriesCacheManagement2.updateRepliesCount = updateRepliesCount;
  function addReply(reply, parentAuthor, parentPermlink, qc) {
    mutateEntry(
      parentAuthor,
      parentPermlink,
      (entry) => ({
        ...entry,
        children: entry.children + 1,
        replies: [reply, ...entry.replies]
      }),
      qc
    );
  }
  EntriesCacheManagement2.addReply = addReply;
  function updateEntries(entries, qc) {
    entries.forEach((entry) => setEntryInCache(entry, qc));
  }
  EntriesCacheManagement2.updateEntries = updateEntries;
  function invalidateEntry(author, permlink, qc) {
    const queryClient = qc ?? getQueryClient();
    queryClient.invalidateQueries({
      queryKey: ["posts", "entry", makeEntryPath3(author, permlink)]
    });
  }
  EntriesCacheManagement2.invalidateEntry = invalidateEntry;
  function getEntry(author, permlink, qc) {
    return getEntryFromCache(author, permlink, qc);
  }
  EntriesCacheManagement2.getEntry = getEntry;
})(exports.EntriesCacheManagement || (exports.EntriesCacheManagement = {}));

// src/modules/posts/mutations/use-vote.ts
function useVote(username, auth) {
  return useBroadcastMutation(
    ["posts", "vote"],
    username,
    ({ author, permlink, weight }) => [
      buildVoteOp(username, author, permlink, weight)
    ],
    async (result, variables) => {
      const entry = exports.EntriesCacheManagement.getEntry(variables.author, variables.permlink);
      if (entry?.active_votes) {
        const newVotes = [
          ...entry.active_votes.filter((v) => v.voter !== username),
          ...variables.weight !== 0 ? [{ rshares: variables.weight, voter: username }] : []
        ];
        const newPayout = entry.payout + (variables.estimated ?? 0);
        exports.EntriesCacheManagement.updateVotes(
          variables.author,
          variables.permlink,
          newVotes,
          newPayout
        );
      }
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        await auth.adapter.recordActivity(120, result.block_num, result.id);
      }
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["posts", "entry", `/@${variables.author}/${variables.permlink}`],
          ["account", username, "votingPower"]
        ]);
      }
    },
    auth
  );
}

// src/modules/posts/mutations/use-reblog.ts
function useReblog(username, auth) {
  return useBroadcastMutation(
    ["posts", "reblog"],
    username,
    ({ author, permlink, deleteReblog }) => [
      buildReblogOp(username, author, permlink, deleteReblog ?? false)
    ],
    async (result, variables) => {
      const entry = exports.EntriesCacheManagement.getEntry(variables.author, variables.permlink);
      if (entry) {
        const newCount = Math.max(0, (entry.reblogs ?? 0) + (variables.deleteReblog ? -1 : 1));
        exports.EntriesCacheManagement.updateReblogsCount(variables.author, variables.permlink, newCount);
      }
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        await auth.adapter.recordActivity(130, result.block_num, result.id);
      }
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["posts", "blog", username],
          ["posts", "entry", `/@${variables.author}/${variables.permlink}`]
        ]);
      }
    },
    auth
  );
}

// src/modules/posts/mutations/use-comment.ts
function useComment(username, auth) {
  return useBroadcastMutation(
    ["posts", "comment"],
    username,
    (payload) => {
      const operations = [];
      operations.push(
        buildCommentOp(
          payload.author,
          payload.permlink,
          payload.parentAuthor,
          payload.parentPermlink,
          payload.title,
          payload.body,
          payload.jsonMetadata
        )
      );
      if (payload.options) {
        const {
          maxAcceptedPayout = "1000000.000 HBD",
          percentHbd = 1e4,
          allowVotes = true,
          allowCurationRewards = true,
          beneficiaries = []
        } = payload.options;
        const extensions = [];
        if (beneficiaries.length > 0) {
          const sortedBeneficiaries = [...beneficiaries].sort(
            (a, b) => a.account.localeCompare(b.account)
          );
          extensions.push([
            0,
            {
              beneficiaries: sortedBeneficiaries.map((b) => ({
                account: b.account,
                weight: b.weight
              }))
            }
          ]);
        }
        operations.push(
          buildCommentOptionsOp(
            payload.author,
            payload.permlink,
            maxAcceptedPayout,
            percentHbd,
            allowVotes,
            allowCurationRewards,
            extensions
          )
        );
      }
      return operations;
    },
    async (result, variables) => {
      const isPost = !variables.parentAuthor;
      const activityType = isPost ? 100 : 110;
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        try {
          await auth.adapter.recordActivity(activityType, result.block_num, result.id);
        } catch (err) {
          console.warn("[useComment] Failed to record activity:", err);
        }
      }
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate = [
          ["posts", "feed", username],
          ["posts", "blog", username],
          ["account", username, "rc"]
          // RC decreases after posting/commenting
        ];
        if (!isPost) {
          queriesToInvalidate.push([
            "posts",
            "entry",
            `/@${variables.parentAuthor}/${variables.parentPermlink}`
          ]);
          const discussionsAuthor = variables.rootAuthor || variables.parentAuthor;
          const discussionsPermlink = variables.rootPermlink || variables.parentPermlink;
          queriesToInvalidate.push({
            predicate: (query) => {
              const key = query.queryKey;
              return Array.isArray(key) && key[0] === "posts" && key[1] === "discussions" && key[2] === discussionsAuthor && key[3] === discussionsPermlink;
            }
          });
        }
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}

// src/modules/posts/cache/discussions-cache-utils.ts
function addOptimisticDiscussionEntry(entry, rootAuthor, rootPermlink, qc) {
  const queryClient = qc ?? getQueryClient();
  const queries = queryClient.getQueriesData({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === "posts" && key[1] === "discussions" && key[2] === rootAuthor && key[3] === rootPermlink;
    }
  });
  for (const [queryKey, data] of queries) {
    if (data) {
      queryClient.setQueryData(queryKey, [entry, ...data]);
    }
  }
}
function removeOptimisticDiscussionEntry(author, permlink, rootAuthor, rootPermlink, qc) {
  const queryClient = qc ?? getQueryClient();
  const snapshots = /* @__PURE__ */ new Map();
  const queries = queryClient.getQueriesData({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === "posts" && key[1] === "discussions" && key[2] === rootAuthor && key[3] === rootPermlink;
    }
  });
  for (const [queryKey, data] of queries) {
    if (data) {
      snapshots.set(queryKey, data);
      queryClient.setQueryData(
        queryKey,
        data.filter(
          (e) => e.author !== author || e.permlink !== permlink
        )
      );
    }
  }
  return snapshots;
}
function restoreDiscussionSnapshots(snapshots, qc) {
  const queryClient = qc ?? getQueryClient();
  for (const [queryKey, data] of snapshots) {
    queryClient.setQueryData(queryKey, data);
  }
}
function updateEntryInCache(author, permlink, updates, qc) {
  const queryClient = qc ?? getQueryClient();
  const path = `/@${author}/${permlink}`;
  const previous = queryClient.getQueryData(["posts", "entry", path]);
  if (previous) {
    queryClient.setQueryData(["posts", "entry", path], {
      ...previous,
      ...updates
    });
  }
  return previous;
}
function restoreEntryInCache(author, permlink, entry, qc) {
  const queryClient = qc ?? getQueryClient();
  const path = `/@${author}/${permlink}`;
  queryClient.setQueryData(["posts", "entry", path], entry);
}

// src/modules/posts/mutations/use-delete-comment.ts
function useDeleteComment(username, auth) {
  return useBroadcastMutation(
    ["posts", "deleteComment"],
    username,
    ({ author, permlink }) => [
      buildDeleteCommentOp(author, permlink)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate = [
          ["posts", "feed", username],
          ["posts", "blog", username]
        ];
        if (variables.parentAuthor && variables.parentPermlink) {
          queriesToInvalidate.push([
            "posts",
            "entry",
            `/@${variables.parentAuthor}/${variables.parentPermlink}`
          ]);
          const discussionsAuthor = variables.rootAuthor || variables.parentAuthor;
          const discussionsPermlink = variables.rootPermlink || variables.parentPermlink;
          queriesToInvalidate.push({
            predicate: (query) => {
              const key = query.queryKey;
              return Array.isArray(key) && key[0] === "posts" && key[1] === "discussions" && key[2] === discussionsAuthor && key[3] === discussionsPermlink;
            }
          });
        }
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth,
    "posting",
    {
      // Optimistic removal: remove from discussions cache before broadcast
      onMutate: async (variables) => {
        const rootAuthor = variables.rootAuthor || variables.parentAuthor;
        const rootPermlink = variables.rootPermlink || variables.parentPermlink;
        if (rootAuthor && rootPermlink) {
          const snapshots = removeOptimisticDiscussionEntry(
            variables.author,
            variables.permlink,
            rootAuthor,
            rootPermlink
          );
          return { snapshots };
        }
        return {};
      },
      // Rollback on error: restore discussions cache
      onError: (_error, _variables, context) => {
        const { snapshots } = context ?? {};
        if (snapshots) {
          restoreDiscussionSnapshots(snapshots);
        }
      }
    }
  );
}

// src/modules/posts/mutations/use-cross-post.ts
function useCrossPost(username, auth) {
  return useBroadcastMutation(
    ["posts", "cross-post"],
    username,
    (payload) => {
      const operations = [];
      operations.push(
        buildCommentOp(
          payload.author,
          payload.permlink,
          "",
          // empty parent_author for top-level post
          payload.parentPermlink,
          // community ID
          payload.title,
          payload.body,
          payload.jsonMetadata
        )
      );
      if (payload.options) {
        const {
          maxAcceptedPayout = "1000000.000 HBD",
          percentHbd = 1e4,
          allowVotes = true,
          allowCurationRewards = true
        } = payload.options;
        operations.push(
          buildCommentOptionsOp(
            payload.author,
            payload.permlink,
            maxAcceptedPayout,
            percentHbd,
            allowVotes,
            allowCurationRewards,
            []
            // No beneficiaries for cross-posts
          )
        );
      }
      return operations;
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate = [
          ["posts", "feed", username],
          ["posts", "blog", username]
        ];
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}

// src/modules/posts/mutations/use-update-reply.ts
function useUpdateReply(username, auth) {
  return useBroadcastMutation(
    ["posts", "update-reply"],
    username,
    (payload) => {
      const operations = [];
      operations.push(
        buildCommentOp(
          payload.author,
          payload.permlink,
          payload.parentAuthor,
          payload.parentPermlink,
          payload.title,
          payload.body,
          payload.jsonMetadata
        )
      );
      if (payload.options) {
        const {
          maxAcceptedPayout = "1000000.000 HBD",
          percentHbd = 1e4,
          allowVotes = true,
          allowCurationRewards = true,
          beneficiaries = []
        } = payload.options;
        const extensions = [];
        if (beneficiaries.length > 0) {
          const sortedBeneficiaries = [...beneficiaries].sort(
            (a, b) => a.account.localeCompare(b.account)
          );
          extensions.push([
            0,
            {
              beneficiaries: sortedBeneficiaries.map((b) => ({
                account: b.account,
                weight: b.weight
              }))
            }
          ]);
        }
        operations.push(
          buildCommentOptionsOp(
            payload.author,
            payload.permlink,
            maxAcceptedPayout,
            percentHbd,
            allowVotes,
            allowCurationRewards,
            extensions
          )
        );
      }
      return operations;
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate = [
          ["account", username, "rc"]
          // RC decreases after updating
        ];
        queriesToInvalidate.push([
          "posts",
          "entry",
          `/@${variables.parentAuthor}/${variables.parentPermlink}`
        ]);
        const discussionsAuthor = variables.rootAuthor || variables.parentAuthor;
        const discussionsPermlink = variables.rootPermlink || variables.parentPermlink;
        queriesToInvalidate.push({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key[0] === "posts" && key[1] === "discussions" && key[2] === discussionsAuthor && key[3] === discussionsPermlink;
          }
        });
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}

// src/modules/posts/mutations/use-promote.ts
function usePromote(username, auth) {
  return useBroadcastMutation(
    ["ecency", "promote"],
    username,
    ({ author, permlink, duration }) => [
      buildPromoteOp(username, author, permlink, duration)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          // Invalidate promoted posts feed
          ["posts", "promoted"],
          // Invalidate user points balance
          ["points", username],
          // Invalidate specific post cache to update promotion status
          ["posts", "entry", `/@${variables.author}/${variables.permlink}`]
        ]);
      }
    },
    auth,
    "active"
  );
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
function getLocationInfo() {
  if (typeof window !== "undefined" && window.location) {
    return {
      url: window.location.href,
      domain: window.location.host
    };
  }
  return { url: "", domain: "" };
}
function useRecordActivity(username, activityType, options) {
  return reactQuery.useMutation({
    mutationKey: ["analytics", activityType],
    mutationFn: async () => {
      if (!activityType) {
        throw new Error("[SDK][Analytics] \u2013 no activity type provided");
      }
      const fetchApi = getBoundFetch();
      const locationInfo = getLocationInfo();
      const url = options?.url ?? locationInfo.url;
      const domain = options?.domain ?? locationInfo.domain;
      await fetchApi(CONFIG.plausibleHost + "/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: activityType,
          url,
          domain,
          props: {
            username
          }
        })
      });
    }
  });
}
function getDiscoverLeaderboardQueryOptions(duration) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  const sortedDimensions = [...dimensions].sort();
  const sortedMetrics = [...metrics].sort();
  return reactQuery.queryOptions({
    queryKey: ["analytics", "page-stats", url, sortedDimensions, sortedMetrics, dateRange],
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
    enabled: !!url,
    // Analytics data should always be fresh - users expect current stats when changing range
    staleTime: 0
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
  return reactQuery.queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
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
function getAccountTokenQueryOptions(username, accessToken) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
function getGameStatusCheckQueryOptions(username, code, gameType) {
  return reactQuery.queryOptions({
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
  return reactQuery.useMutation({
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

// src/modules/communities/mutations/use-subscribe-community.ts
function useSubscribeCommunity(username, auth) {
  return useBroadcastMutation(
    ["communities", "subscribe"],
    username,
    ({ community }) => [
      buildSubscribeOp(username, community)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "subscriptions", username],
          ["communities", variables.community]
        ]);
      }
    },
    auth
  );
}

// src/modules/communities/mutations/use-unsubscribe-community.ts
function useUnsubscribeCommunity(username, auth) {
  return useBroadcastMutation(
    ["communities", "unsubscribe"],
    username,
    ({ community }) => [
      buildUnsubscribeOp(username, community)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "subscriptions", username],
          ["communities", variables.community]
        ]);
      }
    },
    auth
  );
}

// src/modules/communities/mutations/use-mute-post.ts
function useMutePost(username, auth) {
  return useBroadcastMutation(
    ["communities", "mutePost"],
    username,
    ({ community, author, permlink, notes, mute }) => [
      buildMutePostOp(username, community, author, permlink, notes, mute)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          // Invalidate community posts to hide/show muted content
          ["communities", variables.community, "posts"],
          // Invalidate specific post cache to update mute status
          ["posts", "entry", `/@${variables.author}/${variables.permlink}`],
          // Invalidate feed caches to remove/restore muted posts
          ["posts", "feed", variables.community]
        ]);
      }
    },
    auth
  );
}

// src/modules/communities/mutations/use-set-community-role.ts
function useSetCommunityRole(community, username, auth) {
  return useBroadcastMutation(
    ["communities", "set-role", community],
    username,
    ({ account, role }) => [
      buildSetRoleOp(username, community, account, role)
    ],
    async (_result, variables) => {
      const qc = getQueryClient();
      qc.setQueryData(
        ["community", "single", community],
        (prev) => {
          if (!prev) return prev;
          const team = [...prev.team ?? []];
          const idx = team.findIndex(([name]) => name === variables.account);
          if (idx >= 0) {
            team[idx] = [team[idx][0], variables.role, team[idx][2] ?? ""];
          } else {
            team.push([variables.account, variables.role, ""]);
          }
          return { ...prev, team };
        }
      );
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["community", community]
        ]);
      }
    },
    auth
  );
}

// src/modules/communities/mutations/use-update-community.ts
function useUpdateCommunity(community, username, auth) {
  return useBroadcastMutation(
    ["communities", "update", community],
    username,
    (props) => [
      buildUpdateCommunityOp(username, community, props)
    ],
    async (_result, variables) => {
      const qc = getQueryClient();
      qc.setQueryData(
        ["community", "single", community],
        (prev) => {
          if (!prev) return prev;
          return { ...prev, ...variables };
        }
      );
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["community", community]
        ]);
      }
    },
    auth
  );
}

// src/modules/communities/mutations/use-register-community-rewards.ts
function useRegisterCommunityRewards(username, auth) {
  return useBroadcastMutation(
    ["communities", "registerRewards"],
    username,
    ({ name }) => [
      buildCommunityRegistrationOp(name)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          // Invalidate community cache to update registration status
          ["communities", variables.name],
          // Invalidate points balance
          ["points", username]
        ]);
      }
    },
    auth,
    "active"
  );
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
function getCommunityQueryOptions(name, observer = "", enabled = true) {
  return reactQuery.queryOptions({
    queryKey: ["community", "single", name, observer],
    enabled: enabled && !!name,
    queryFn: async () => getCommunity(name ?? "", observer)
  });
}
function getCommunitySubscribersQueryOptions(communityName) {
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
function getNotificationsSettingsQueryOptions(activeUsername, code, initialMuted) {
  return reactQuery.queryOptions({
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
      return {
        status: 0,
        system: "web",
        allows_notify: 0,
        notify_types: initialMuted ? [] : [
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
  return reactQuery.queryOptions({
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
function useMarkNotificationsRead(username, code, onSuccess, onError) {
  const queryClient = getQueryClient();
  return reactQuery.useMutation({
    mutationKey: ["notifications", "mark-read", username],
    mutationFn: async ({ id }) => {
      if (!username || !code) {
        throw new Error("[SDK][Notifications] \u2013 missing auth for markNotifications");
      }
      return markNotifications(code, id);
    },
    // Optimistic update: Immediately mark notifications as read in cache
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousNotifications = [];
      const queriesData = queryClient.getQueriesData({
        queryKey: ["notifications"]
      });
      queriesData.forEach(([queryKey, data]) => {
        if (data) {
          previousNotifications.push([queryKey, data]);
          const updatedData = data.map((item) => ({
            ...item,
            // If specific ID provided: mark only that notification
            // If no ID (mark all): mark ALL notifications
            read: !id || id === item.id ? 1 : item.read
          }));
          queryClient.setQueryData(queryKey, updatedData);
        }
      });
      return { previousNotifications };
    },
    onSuccess: (response, variables) => {
      const unreadCount = typeof response === "object" && response !== null ? response.unread : void 0;
      onSuccess?.(unreadCount);
      if (!variables.id) {
        queryClient.invalidateQueries({
          queryKey: ["notifications"]
        });
      }
    },
    // Rollback optimistic update on error
    onError: (error, _variables, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      onError?.(error);
    },
    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"]
      });
    }
  });
}
function getProposalQueryOptions(id) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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

// src/modules/proposals/mutations/use-proposal-vote.ts
function useProposalVote(username, auth) {
  return useBroadcastMutation(
    ["proposals", "vote"],
    username,
    ({ proposalIds, approve }) => [
      buildProposalVoteOp(username, proposalIds, approve)
    ],
    async (result) => {
      try {
        if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
          await auth.adapter.recordActivity(150, result.block_num, result.id);
        }
        if (auth?.adapter?.invalidateQueries) {
          await auth.adapter.invalidateQueries([
            ["proposals", "list"],
            ["proposals", "votes", username]
          ]);
        }
      } catch (error) {
        console.warn("[useProposalVote] Post-broadcast side-effect failed:", error);
      }
    },
    auth,
    "active"
    // Use active authority for proposal votes (required by blockchain)
  );
}
function getVestingDelegationsQueryOptions(username, limit = 50) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["wallet", "vesting-delegations", username, limit],
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const fetchLimit = pageParam ? limit + 1 : limit;
      const result = await CONFIG.hiveClient.database.call("get_vesting_delegations", [
        username,
        pageParam || "",
        fetchLimit
      ]);
      if (pageParam && result.length > 0 && result[0]?.delegatee === pageParam) {
        return result.slice(1, limit + 1);
      }
      return result;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < limit) {
        return void 0;
      }
      const lastDelegation = lastPage[lastPage.length - 1];
      return lastDelegation?.delegatee;
    },
    enabled: !!username
  });
}
function getConversionRequestsQueryOptions(account) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "conversion-requests", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_conversion_requests", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.requestid - b.requestid)
  });
}
function getCollateralizedConversionRequestsQueryOptions(account) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "collateralized-conversion-requests", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_collateralized_conversion_requests", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.requestid - b.requestid)
  });
}
function getSavingsWithdrawFromQueryOptions(account) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "savings-withdraw", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_savings_withdraw_from", [
      account
    ]),
    select: (data) => data.sort((a, b) => a.request_id - b.request_id)
  });
}
function getWithdrawRoutesQueryOptions(account) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "withdraw-routes", account],
    queryFn: () => CONFIG.hiveClient.database.call("get_withdraw_routes", [
      account,
      "outgoing"
    ])
  });
}
function getOpenOrdersQueryOptions(user) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "open-orders", user],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_open_orders", [
      user
    ]),
    select: (data) => data.sort((a, b) => a.orderid - b.orderid),
    enabled: !!user
  });
}
function getOutgoingRcDelegationsInfiniteQueryOptions(username, limit = 100) {
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
function getRecurrentTransfersQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["wallet", "recurrent-transfers", username],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "find_recurrent_transfers", [
      username
    ]),
    enabled: !!username
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
function getPortfolioQueryOptions(username, currency = "usd", onlyEnabled = true) {
  return reactQuery.queryOptions({
    queryKey: [
      "wallet",
      "portfolio",
      "v2",
      username,
      onlyEnabled ? "only-enabled" : "all",
      currency
    ],
    enabled: Boolean(username),
    staleTime: 6e4,
    refetchInterval: 12e4,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallet] \u2013 username is required");
      }
      if (CONFIG.privateApiHost === void 0 || CONFIG.privateApiHost === null) {
        throw new Error(
          "[SDK][Wallet] \u2013 privateApiHost isn't configured for portfolio"
        );
      }
      const endpoint = `${CONFIG.privateApiHost}/wallet-api/portfolio-v2`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, onlyEnabled, currency })
      });
      if (!response.ok) {
        throw new Error(
          `[SDK][Wallet] \u2013 Portfolio request failed (${response.status})`
        );
      }
      const payload = await response.json();
      const tokens = extractTokens(payload).map((item) => parseToken(item)).filter((item) => Boolean(item));
      if (!tokens.length) {
        throw new Error(
          "[SDK][Wallet] \u2013 Portfolio payload contained no tokens"
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
function getHiveAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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
function getHbdAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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
      const price = 1;
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
      const delegatedVests = parseAsset(
        accountData.delegated_vesting_shares
      ).amount;
      const receivedVests = parseAsset(
        accountData.received_vesting_shares
      ).amount;
      const withdrawRateVests = parseAsset(
        accountData.vesting_withdraw_rate
      ).amount;
      const remainingToWithdrawVests = Math.max(
        (Number(accountData.to_withdraw) - Number(accountData.withdrawn)) / 1e6,
        0
      );
      const nextWithdrawalVests = !isEmptyDate(
        accountData.next_vesting_withdrawal
      ) ? Math.min(withdrawRateVests, remainingToWithdrawVests) : 0;
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
      const availableHp = Math.max(hpBalance - outgoingDelegationsHp, 0);
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
var ops2 = dhive.utils.operationOrders;
var HIVE_ACCOUNT_OPERATION_GROUPS = {
  transfers: [
    ops2.transfer,
    ops2.transfer_to_savings,
    ops2.transfer_from_savings,
    ops2.cancel_transfer_from_savings,
    ops2.recurrent_transfer,
    ops2.fill_recurrent_transfer,
    ops2.escrow_transfer,
    ops2.fill_recurrent_transfer
  ],
  "market-orders": [
    ops2.fill_convert_request,
    ops2.fill_order,
    ops2.fill_collateralized_convert_request,
    ops2.limit_order_create2,
    ops2.limit_order_create,
    ops2.limit_order_cancel
  ],
  interests: [ops2.interest],
  "stake-operations": [
    ops2.return_vesting_delegation,
    ops2.withdraw_vesting,
    ops2.transfer_to_vesting,
    ops2.set_withdraw_vesting_route,
    ops2.update_proposal_votes,
    ops2.fill_vesting_withdraw,
    ops2.account_witness_proxy,
    ops2.delegate_vesting_shares
  ],
  rewards: [
    ops2.author_reward,
    ops2.curation_reward,
    ops2.producer_reward,
    ops2.claim_reward_balance,
    ops2.comment_benefactor_reward,
    ops2.liquidity_reward,
    ops2.proposal_pay
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

// src/modules/wallet/queries/get-hive-asset-transactions-query-options.ts
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
  return [
    low !== 0n ? low.toString() : null,
    high !== 0n ? high.toString() : null
  ];
}
function getHiveAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterArgs, filterKey } = resolveHiveOperationFilters(filters);
  return reactQuery.infiniteQueryOptions({
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
              const hivePayout = parseAsset(
                item.hive_payout
              );
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
              const hbdPayout = parseAsset(
                item.hbd_payout
              );
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
function getHivePowerAssetTransactionsQueryOptions(username, limit = 20, filters = []) {
  const { filterKey } = resolveHiveOperationFilters(filters);
  const userSelectedOperations = new Set(
    Array.isArray(filters) ? filters : [filters]
  );
  const hasAllFilter = userSelectedOperations.has("") || userSelectedOperations.size === 0;
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
              return ["VESTS", "HP"].includes(parseAsset(item.amount).symbol);
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
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function subtractSeconds(date, seconds) {
  return new Date(date.getTime() - seconds * 1e3);
}
function getHiveAssetMetricQueryOptions(bucketSeconds = 86400) {
  return reactQuery.infiniteQueryOptions({
    queryKey: ["assets", "hive", "metrics", bucketSeconds],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [bucketSeconds, formatDate(startDate), formatDate(endDate)]
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
      subtractSeconds(/* @__PURE__ */ new Date(), Math.max(100 * bucketSeconds, 28800)),
      /* @__PURE__ */ new Date()
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      subtractSeconds(prevStartDate, Math.max(100 * bucketSeconds, 28800)),
      subtractSeconds(prevStartDate, bucketSeconds)
    ]
  });
}
function getHiveAssetWithdrawalRoutesQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () => CONFIG.hiveClient.database.call("get_withdraw_routes", [
      username,
      "outgoing"
    ])
  });
}
function getHivePowerDelegatesInfiniteQueryOptions(username, limit = 50) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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

// src/modules/wallet/types/asset-operation.ts
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

// src/modules/wallet/mutations/use-transfer.ts
function useTransfer(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer"],
    username,
    (payload) => [
      buildTransferOp(username, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-point.ts
function useTransferPoint(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-point"],
    username,
    (payload) => [
      buildPointTransferOp(username, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-delegate-vesting-shares.ts
function useDelegateVestingShares(username, auth) {
  return useBroadcastMutation(
    ["wallet", "delegate-vesting-shares"],
    username,
    (payload) => [
      buildDelegateVestingSharesOp(
        username,
        payload.delegatee,
        payload.vestingShares
      )
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "delegations", username],
          ["accounts", username],
          ["accounts", variables.delegatee]
        ]);
      }
    },
    auth,
    "active"
    // IMPORTANT: Active authority required
  );
}

// src/modules/wallet/mutations/use-set-withdraw-vesting-route.ts
function useSetWithdrawVestingRoute(username, auth) {
  return useBroadcastMutation(
    ["wallet", "set-withdraw-vesting-route"],
    username,
    (payload) => [
      buildSetWithdrawVestingRouteOp(
        username,
        payload.toAccount,
        payload.percent,
        payload.autoVest
      )
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "withdraw-routes", username],
          ["accounts", username],
          ["accounts", variables.toAccount]
        ]);
      }
    },
    auth,
    "active"
    // IMPORTANT: Active authority required
  );
}

// src/modules/wallet/mutations/use-transfer-spk.ts
function useTransferSpk(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-spk"],
    username,
    (payload) => {
      const json = JSON.stringify({
        to: payload.to,
        amount: payload.amount,
        token: "SPK"
      });
      return [["custom_json", {
        required_auths: [username],
        required_posting_auths: [],
        id: "spkcc_spk_send",
        json
      }]];
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-larynx.ts
function useTransferLarynx(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({
        to: payload.to,
        amount: payload.amount,
        token: payload.token ?? "LARYNX"
      });
      return [["custom_json", {
        required_auths: [username],
        required_posting_auths: [],
        id: "spkcc_send",
        json
      }]];
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-engine-token.ts
function useTransferEngineToken(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity,
          memo: payload.memo
        }
      });
      return [["custom_json", {
        required_auths: [username],
        required_posting_auths: [],
        id: "ssc-mainnet-hive",
        json
      }]];
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-to-savings.ts
function useTransferToSavings(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-to-savings"],
    username,
    (payload) => [
      buildTransferToSavingsOp(username, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-from-savings.ts
function useTransferFromSavings(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-from-savings"],
    username,
    (payload) => [
      buildTransferFromSavingsOp(username, payload.to, payload.amount, payload.memo, payload.requestId)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username],
          ["wallet", "savings-withdrawals", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-transfer-to-vesting.ts
function useTransferToVesting(username, auth) {
  return useBroadcastMutation(
    ["wallet", "transfer-to-vesting"],
    username,
    (payload) => [
      buildTransferToVestingOp(username, payload.to, payload.amount)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-withdraw-vesting.ts
function useWithdrawVesting(username, auth) {
  return useBroadcastMutation(
    ["wallet", "withdraw-vesting"],
    username,
    (payload) => [
      buildWithdrawVestingOp(username, payload.vestingShares)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-convert.ts
function useConvert(username, auth) {
  return useBroadcastMutation(
    ["wallet", "convert"],
    username,
    (payload) => [
      payload.collateralized ? buildCollateralizedConvertOp(username, payload.amount, payload.requestId) : buildConvertOp(username, payload.amount, payload.requestId)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-claim-interest.ts
function useClaimInterest(username, auth) {
  return useBroadcastMutation(
    ["wallet", "claim-interest"],
    username,
    (payload) => buildClaimInterestOps(username, payload.to, payload.amount, payload.memo, payload.requestId),
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-claim-rewards.ts
function useClaimRewards(username, auth) {
  return useBroadcastMutation(
    ["wallet", "claim-rewards"],
    username,
    (payload) => [
      buildClaimRewardBalanceOp(username, payload.rewardHive, payload.rewardHbd, payload.rewardVests)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["get-account-full", username],
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "posting"
  );
}

// src/modules/wallet/mutations/use-lock-larynx.ts
function useLockLarynx(username, auth) {
  return useBroadcastMutation(
    ["wallet", "lock-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({ amount: payload.amount * 1e3 });
      return [["custom_json", {
        id: payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-power-larynx.ts
function usePowerLarynx(username, auth) {
  return useBroadcastMutation(
    ["wallet", "power-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({ amount: payload.amount * 1e3 });
      return [["custom_json", {
        id: `spkcc_power_${payload.mode}`,
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-delegate-engine-token.ts
function useDelegateEngineToken(username, auth) {
  return useBroadcastMutation(
    ["wallet", "delegate-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "delegate",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity
        }
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-undelegate-engine-token.ts
function useUndelegateEngineToken(username, auth) {
  return useBroadcastMutation(
    ["wallet", "undelegate-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "undelegate",
        contractPayload: {
          symbol: payload.symbol,
          from: payload.from,
          quantity: payload.quantity
        }
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-stake-engine-token.ts
function useStakeEngineToken(username, auth) {
  return useBroadcastMutation(
    ["wallet", "stake-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "stake",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity
        }
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-unstake-engine-token.ts
function useUnstakeEngineToken(username, auth) {
  return useBroadcastMutation(
    ["wallet", "unstake-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "unstake",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity
        }
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-claim-engine-rewards.ts
function useClaimEngineRewards(username, auth) {
  return useBroadcastMutation(
    ["wallet", "claim-engine-rewards"],
    username,
    (payload) => {
      const json = JSON.stringify(payload.tokens.map((symbol) => ({ symbol })));
      return [["custom_json", {
        id: "scot_claim_token",
        required_auths: [],
        required_posting_auths: [username],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "posting"
  );
}

// src/modules/wallet/mutations/use-engine-market-order.ts
function useEngineMarketOrder(username, auth) {
  return useBroadcastMutation(
    ["wallet", "engine-market-order"],
    username,
    (payload) => {
      let contractPayload;
      let contractAction;
      if (payload.action === "cancel") {
        contractAction = "cancel";
        contractPayload = {
          type: payload.orderType,
          id: payload.orderId
        };
      } else {
        contractAction = payload.action;
        contractPayload = {
          symbol: payload.symbol,
          quantity: payload.quantity,
          price: payload.price
        };
      }
      const json = JSON.stringify({
        contractName: "market",
        contractAction,
        contractPayload
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username],
        required_posting_auths: [],
        json
      }]];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username]
        ]);
      }
    },
    auth,
    "active"
  );
}

// src/modules/wallet/mutations/use-wallet-operation.ts
function buildHiveOperations(asset, operation, payload) {
  const { from, to = "", amount = "", memo = "" } = payload;
  const requestId = payload.request_id ?? Date.now() >>> 0;
  switch (asset) {
    case "HIVE":
      switch (operation) {
        case "transfer" /* Transfer */:
          return [buildTransferOp(from, to, amount, memo)];
        case "transfer-saving" /* TransferToSavings */:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case "withdraw-saving" /* WithdrawFromSavings */:
          return [buildTransferFromSavingsOp(from, to, amount, memo, requestId)];
        case "power-up" /* PowerUp */:
          return [buildTransferToVestingOp(from, to, amount)];
      }
      break;
    case "HBD":
      switch (operation) {
        case "transfer" /* Transfer */:
          return [buildTransferOp(from, to, amount, memo)];
        case "transfer-saving" /* TransferToSavings */:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case "withdraw-saving" /* WithdrawFromSavings */:
          return [buildTransferFromSavingsOp(from, to, amount, memo, requestId)];
        case "claim-interest" /* ClaimInterest */:
          return buildClaimInterestOps(from, to, amount, memo, requestId);
        case "convert" /* Convert */:
          return [buildConvertOp(from, amount, Math.floor(Date.now() / 1e3))];
      }
      break;
    case "HP":
      switch (operation) {
        case "power-down" /* PowerDown */:
          return [buildWithdrawVestingOp(from, amount)];
        case "delegate" /* Delegate */:
          return [buildDelegateVestingSharesOp(from, to, amount)];
        case "withdraw-routes" /* WithdrawRoutes */:
          return [buildSetWithdrawVestingRouteOp(
            payload.from_account ?? from,
            payload.to_account ?? to,
            payload.percent ?? 0,
            payload.auto_vest ?? false
          )];
      }
      break;
    case "POINTS":
      if (operation === "transfer" /* Transfer */ || operation === "gift" /* Gift */) {
        return [buildPointTransferOp(from, to, amount, memo)];
      }
      break;
    case "SPK":
      if (operation === "transfer" /* Transfer */) {
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
        case "transfer" /* Transfer */: {
          const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1e3;
          return [["custom_json", {
            id: "spkcc_send",
            required_auths: [from],
            required_posting_auths: [],
            json: JSON.stringify({ to, amount: numAmount })
          }]];
        }
        case "lock" /* LockLiquidity */: {
          const parsedAmount = typeof payload.amount === "string" ? parseFloat(payload.amount) : Number(payload.amount ?? 0);
          const id = payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down";
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
        case "power-up" /* PowerUp */: {
          const parsedAmount = typeof payload.amount === "string" ? parseFloat(payload.amount) : Number(payload.amount ?? 0);
          const id = `spkcc_power_${payload.mode ?? "up"}`;
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
      }
      break;
  }
  return null;
}
function buildEngineOperations(asset, operation, payload) {
  const { from, to = "", amount = "" } = payload;
  const quantity = typeof amount === "string" && amount.includes(" ") ? amount.split(" ")[0] : String(amount);
  switch (operation) {
    case "transfer" /* Transfer */:
      return [buildEngineOp(from, "transfer", {
        symbol: asset,
        to,
        quantity,
        memo: payload.memo ?? ""
      })];
    case "stake" /* Stake */:
      return [buildEngineOp(from, "stake", { symbol: asset, to, quantity })];
    case "unstake" /* Unstake */:
      return [buildEngineOp(from, "unstake", { symbol: asset, to, quantity })];
    case "delegate" /* Delegate */:
      return [buildEngineOp(from, "delegate", { symbol: asset, to, quantity })];
    case "undelegate" /* Undelegate */:
      return [buildEngineOp(from, "undelegate", { symbol: asset, from: to, quantity })];
    case "claim" /* Claim */:
      return [buildEngineClaimOp(from, [asset])];
  }
  return null;
}
function useWalletOperation(username, asset, operation, auth) {
  const { mutateAsync: recordActivity } = mutations_exports.useRecordActivity(
    username,
    operation
  );
  return useBroadcastMutation(
    ["ecency-wallets", asset, operation],
    username,
    (payload) => {
      const hiveOps = buildHiveOperations(asset, operation, payload);
      if (hiveOps) return hiveOps;
      const engineOps = buildEngineOperations(asset, operation, payload);
      if (engineOps) return engineOps;
      throw new Error(`[SDK][Wallet] \u2013 no operation builder for asset="${asset}" operation="${operation}"`);
    },
    () => {
      recordActivity();
      const keysToInvalidate = [];
      keysToInvalidate.push(["assets", asset]);
      if (asset === "HIVE") {
        keysToInvalidate.push(["assets", "HP"]);
      }
      if (asset === "LARYNX" && operation === "power-up" /* PowerUp */) {
        keysToInvalidate.push(["assets", "LP"]);
        keysToInvalidate.push(["assets", "LARYNX"]);
      }
      keysToInvalidate.push(["ecency-wallets", "portfolio", "v2"]);
      setTimeout(() => {
        keysToInvalidate.forEach((key) => {
          getQueryClient().invalidateQueries({ queryKey: key });
        });
      }, 5e3);
    },
    auth,
    "active"
  );
}

// src/modules/witnesses/mutations/use-witness-vote.ts
function useWitnessVote(username, auth) {
  return useBroadcastMutation(
    ["witnesses", "vote"],
    username,
    ({ witness, approve }) => [
      buildWitnessVoteOp(username, witness, approve)
    ],
    async () => {
      try {
        if (auth?.adapter?.invalidateQueries) {
          await auth.adapter.invalidateQueries([
            ["accounts", username],
            ["witnesses", "votes", username]
          ]);
        }
      } catch (error) {
        console.warn("[useWitnessVote] Post-broadcast side-effect failed:", error);
      }
    },
    auth,
    "active"
    // Use active authority for witness votes (required by blockchain)
  );
}
function getWitnessesInfiniteQueryOptions(limit) {
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
    queryKey: ["market", "order-book", limit],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_order_book", [
      limit
    ])
  });
}
function getMarketStatisticsQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["market", "statistics"],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_ticker", [])
  });
}
function getMarketHistoryQueryOptions(seconds, startDate, endDate) {
  const formatDate3 = (date) => {
    return date.toISOString().replace(/\.\d{3}Z$/, "");
  };
  return reactQuery.queryOptions({
    queryKey: ["market", "history", seconds, startDate.getTime(), endDate.getTime()],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_market_history", [
      seconds,
      formatDate3(startDate),
      formatDate3(endDate)
    ])
  });
}
function getHiveHbdStatsQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["market", "hive-hbd-stats"],
    queryFn: async () => {
      const stats = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_ticker",
        []
      );
      const now = /* @__PURE__ */ new Date();
      const oneDayAgo = new Date(now.getTime() - 864e5);
      const formatDate3 = (date) => {
        return date.toISOString().replace(/\.\d{3}Z$/, "");
      };
      const dayChange = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [86400, formatDate3(oneDayAgo), formatDate3(now)]
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
  return reactQuery.queryOptions({
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
function formatDate2(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}
function getTradeHistoryQueryOptions(limit = 1e3, startDate, endDate) {
  const end = endDate ?? /* @__PURE__ */ new Date();
  const start = startDate ?? new Date(end.getTime() - 10 * 60 * 60 * 1e3);
  return reactQuery.queryOptions({
    queryKey: ["market", "trade-history", limit, start.getTime(), end.getTime()],
    queryFn: () => CONFIG.hiveClient.call("condenser_api", "get_trade_history", [
      formatDate2(start),
      formatDate2(end),
      limit
    ])
  });
}
function getFeedHistoryQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["market", "feed-history"],
    queryFn: async () => {
      try {
        const feedHistory = await CONFIG.hiveClient.database.call("get_feed_history");
        return feedHistory;
      } catch (error) {
        throw error;
      }
    }
  });
}
function getCurrentMedianHistoryPriceQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["market", "current-median-history-price"],
    queryFn: async () => {
      try {
        const price = await CONFIG.hiveClient.database.call(
          "get_current_median_history_price"
        );
        return price;
      } catch (error) {
        throw error;
      }
    }
  });
}

// src/modules/market/requests.ts
async function parseJsonResponse2(response) {
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
  return parseJsonResponse2(response);
}
async function getCurrencyRate(cur) {
  if (cur === "hbd") {
    return 1;
  }
  const fetchApi = getBoundFetch();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&vs_currencies=${cur}`;
  const response = await fetchApi(url);
  const data = await parseJsonResponse2(response);
  return data.hive_dollar[cur];
}
async function getCurrencyTokenRate(currency, token) {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost + `/private-api/market-data/${currency === "hbd" ? "usd" : currency}/${token}`
  );
  return parseJsonResponse2(response);
}
async function getCurrencyRates() {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/market-data/latest");
  return parseJsonResponse2(response);
}
async function getHivePrice() {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    "https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd"
  );
  return parseJsonResponse2(response);
}

// src/modules/points/types/point-transaction-type.ts
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
function getPointsQueryOptions(username, filter = 0) {
  return reactQuery.queryOptions({
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
function getPointsAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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
        accountBalance: +(data?.points ?? 0)
      };
    }
  });
}
function getPointsAssetTransactionsQueryOptions(username, type) {
  return reactQuery.queryOptions({
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
function useClaimPoints(username, accessToken, onSuccess, onError) {
  const { mutateAsync: recordActivity } = mutations_exports.useRecordActivity(
    username,
    "points-claimed"
  );
  return reactQuery.useMutation({
    mutationFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Points][Claim] \u2013 username wasn't provided"
        );
      }
      if (!accessToken) {
        throw new Error(
          "[SDK][Points][Claim] \u2013 access token wasn't found"
        );
      }
      const fetchApi = getBoundFetch();
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
          `[SDK][Points][Claim] \u2013 failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
      }
      return response.json();
    },
    onError,
    onSuccess: () => {
      recordActivity();
      getQueryClient().setQueryData(
        getPointsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }
          return {
            ...data,
            points: (parseFloat(data.points) + parseFloat(data.uPoints)).toFixed(3),
            uPoints: "0"
          };
        }
      );
      onSuccess?.();
    }
  });
}
function searchQueryOptions(q, sort, hideLow, since, scroll_id, votes) {
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.infiniteQueryOptions({
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
  return reactQuery.queryOptions({
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
async function parseJsonResponse3(response) {
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
  return parseJsonResponse3(response);
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
  return parseJsonResponse3(response);
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
  return parseJsonResponse3(response);
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
  const data = await parseJsonResponse3(response);
  return data?.length > 0 ? data : [q];
}
function getBoostPlusPricesQueryOptions(accessToken) {
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  return reactQuery.queryOptions({
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
  const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
  const response = await fetchApi(`${baseUrl}/private-api/engine-api`, {
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
  const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
  const url = new URL("/private-api/engine-account-history", baseUrl);
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
  const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
  const url = new URL("/private-api/engine-chart-api", baseUrl);
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
  const baseUrl = exports.ConfigManager.getValidatedBaseUrl();
  const response = await fetchApi(
    `${baseUrl}/private-api/engine-reward-api/${username}?hive=1`
  );
  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] \u2013 rewards failed with ${response.status}`
    );
  }
  return await response.json();
}

// src/modules/hive-engine/utils/formatted-number.ts
function formattedNumber(value, options = void 0) {
  let opts = {
    fractionDigits: 3,
    prefix: "",
    suffix: ""
  };
  if (options) {
    opts = { ...opts, ...options };
  }
  const { fractionDigits, prefix, suffix } = opts;
  let out = "";
  if (prefix) out += prefix + " ";
  const av = Math.abs(parseFloat(value.toString())) < 1e-4 ? 0 : value;
  const num = typeof av === "string" ? parseFloat(av) : av;
  out += num.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: true
  });
  if (suffix) out += " " + suffix;
  return out;
}

// src/modules/hive-engine/utils/hive-engine-token.ts
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
function getHiveEngineTokensBalancesQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "balances", username],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensBalances(username);
    }
  });
}
function getHiveEngineTokensMarketQueryOptions() {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "markets"],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensMarket();
    }
  });
}
function getHiveEngineTokensMetadataQueryOptions(tokens) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "metadata-list", tokens],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokensMetadata(tokens);
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
          "[SDK][HiveEngine] \u2013 token or username missed"
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
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", symbol],
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      return getHiveEngineTokenMetrics(symbol, interval);
    }
  });
}
function getHiveEngineUnclaimedRewardsQueryOptions(username) {
  return reactQuery.queryOptions({
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
function getAllHiveEngineTokensQueryOptions(account, symbol) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", "all-tokens", account, symbol],
    queryFn: async () => {
      return getHiveEngineTokensMarket(account, symbol);
    }
  });
}
function getHiveEngineBalancesWithUsdQueryOptions(account, dynamicProps, allTokens) {
  return reactQuery.queryOptions({
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
function getHiveEngineTokenGeneralInfoQueryOptions(username, symbol) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "hive-engine", symbol, "general-info", username],
    enabled: !!symbol && !!username,
    staleTime: 6e4,
    refetchInterval: 9e4,
    queryFn: async () => {
      if (!symbol || !username) {
        throw new Error(
          "[SDK][HiveEngine] \u2013 token or username missed"
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

// src/modules/spk/utils/reward-spk.ts
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
function getSpkWalletQueryOptions(username) {
  return reactQuery.queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][SPK] \u2013 username wasn't provided");
      }
      return getSpkWallet(username);
    },
    enabled: !!username,
    staleTime: 6e4,
    refetchInterval: 9e4
  });
}
function getSpkMarketsQueryOptions() {
  return reactQuery.queryOptions({
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
function format(value) {
  return value.toFixed(3);
}
function getSpkAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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
      const price = +format(
        (wallet.gov + wallet.spk) / 1e3 * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format(
        (wallet.spk + rewardSpk(
          wallet,
          market.raw.stats || {
            spk_rate_lgov: "0.001",
            spk_rate_lpow: format(
              parseFloat(market.raw.stats.spk_rate_lpow) * 100
            ),
            spk_rate_ldel: format(
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
function format2(value) {
  return value.toFixed(3);
}
function getLarynxAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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
      const price = +format2(
        wallet.balance / 1e3 * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format2(wallet.balance / 1e3);
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
function format3(value) {
  return value.toFixed(3);
}
function getLarynxPowerAssetGeneralInfoQueryOptions(username) {
  return reactQuery.queryOptions({
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

exports.ACCOUNT_OPERATION_GROUPS = ACCOUNT_OPERATION_GROUPS;
exports.ALL_ACCOUNT_OPERATIONS = ALL_ACCOUNT_OPERATIONS;
exports.ALL_NOTIFY_TYPES = ALL_NOTIFY_TYPES;
exports.AssetOperation = AssetOperation;
exports.BuySellTransactionType = BuySellTransactionType;
exports.CONFIG = CONFIG;
exports.EcencyAnalytics = mutations_exports;
exports.ErrorType = ErrorType;
exports.HIVE_ACCOUNT_OPERATION_GROUPS = HIVE_ACCOUNT_OPERATION_GROUPS;
exports.HIVE_OPERATION_LIST = HIVE_OPERATION_LIST;
exports.HIVE_OPERATION_NAME_BY_ID = HIVE_OPERATION_NAME_BY_ID;
exports.HIVE_OPERATION_ORDERS = HIVE_OPERATION_ORDERS;
exports.HiveEngineToken = HiveEngineToken;
exports.HiveSignerIntegration = HiveSignerIntegration;
exports.NaiMap = NaiMap;
exports.NotificationFilter = NotificationFilter;
exports.NotificationViewType = NotificationViewType;
exports.NotifyTypes = NotifyTypes;
exports.OPERATION_AUTHORITY_MAP = OPERATION_AUTHORITY_MAP;
exports.OrderIdPrefix = OrderIdPrefix;
exports.PointTransactionType = PointTransactionType;
exports.ROLES = ROLES;
exports.SortOrder = SortOrder;
exports.Symbol = Symbol2;
exports.ThreeSpeakIntegration = ThreeSpeakIntegration;
exports.addDraft = addDraft;
exports.addImage = addImage;
exports.addOptimisticDiscussionEntry = addOptimisticDiscussionEntry;
exports.addSchedule = addSchedule;
exports.bridgeApiCall = bridgeApiCall;
exports.broadcastJson = broadcastJson;
exports.buildAccountCreateOp = buildAccountCreateOp;
exports.buildAccountUpdate2Op = buildAccountUpdate2Op;
exports.buildAccountUpdateOp = buildAccountUpdateOp;
exports.buildActiveCustomJsonOp = buildActiveCustomJsonOp;
exports.buildBoostOp = buildBoostOp;
exports.buildBoostOpWithPoints = buildBoostOpWithPoints;
exports.buildBoostPlusOp = buildBoostPlusOp;
exports.buildCancelTransferFromSavingsOp = buildCancelTransferFromSavingsOp;
exports.buildChangeRecoveryAccountOp = buildChangeRecoveryAccountOp;
exports.buildClaimAccountOp = buildClaimAccountOp;
exports.buildClaimInterestOps = buildClaimInterestOps;
exports.buildClaimRewardBalanceOp = buildClaimRewardBalanceOp;
exports.buildCollateralizedConvertOp = buildCollateralizedConvertOp;
exports.buildCommentOp = buildCommentOp;
exports.buildCommentOptionsOp = buildCommentOptionsOp;
exports.buildCommunityRegistrationOp = buildCommunityRegistrationOp;
exports.buildConvertOp = buildConvertOp;
exports.buildCreateClaimedAccountOp = buildCreateClaimedAccountOp;
exports.buildDelegateRcOp = buildDelegateRcOp;
exports.buildDelegateVestingSharesOp = buildDelegateVestingSharesOp;
exports.buildDeleteCommentOp = buildDeleteCommentOp;
exports.buildEngineClaimOp = buildEngineClaimOp;
exports.buildEngineOp = buildEngineOp;
exports.buildFlagPostOp = buildFlagPostOp;
exports.buildFollowOp = buildFollowOp;
exports.buildGrantPostingPermissionOp = buildGrantPostingPermissionOp;
exports.buildIgnoreOp = buildIgnoreOp;
exports.buildLimitOrderCancelOp = buildLimitOrderCancelOp;
exports.buildLimitOrderCreateOp = buildLimitOrderCreateOp;
exports.buildLimitOrderCreateOpWithType = buildLimitOrderCreateOpWithType;
exports.buildMultiPointTransferOps = buildMultiPointTransferOps;
exports.buildMultiTransferOps = buildMultiTransferOps;
exports.buildMutePostOp = buildMutePostOp;
exports.buildMuteUserOp = buildMuteUserOp;
exports.buildPinPostOp = buildPinPostOp;
exports.buildPointTransferOp = buildPointTransferOp;
exports.buildPostingCustomJsonOp = buildPostingCustomJsonOp;
exports.buildProfileMetadata = buildProfileMetadata;
exports.buildPromoteOp = buildPromoteOp;
exports.buildProposalCreateOp = buildProposalCreateOp;
exports.buildProposalVoteOp = buildProposalVoteOp;
exports.buildReblogOp = buildReblogOp;
exports.buildRecoverAccountOp = buildRecoverAccountOp;
exports.buildRecurrentTransferOp = buildRecurrentTransferOp;
exports.buildRemoveProposalOp = buildRemoveProposalOp;
exports.buildRequestAccountRecoveryOp = buildRequestAccountRecoveryOp;
exports.buildRevokePostingPermissionOp = buildRevokePostingPermissionOp;
exports.buildSetLastReadOps = buildSetLastReadOps;
exports.buildSetRoleOp = buildSetRoleOp;
exports.buildSetWithdrawVestingRouteOp = buildSetWithdrawVestingRouteOp;
exports.buildSpkCustomJsonOp = buildSpkCustomJsonOp;
exports.buildSubscribeOp = buildSubscribeOp;
exports.buildTransferFromSavingsOp = buildTransferFromSavingsOp;
exports.buildTransferOp = buildTransferOp;
exports.buildTransferToSavingsOp = buildTransferToSavingsOp;
exports.buildTransferToVestingOp = buildTransferToVestingOp;
exports.buildUnfollowOp = buildUnfollowOp;
exports.buildUnignoreOp = buildUnignoreOp;
exports.buildUnsubscribeOp = buildUnsubscribeOp;
exports.buildUpdateCommunityOp = buildUpdateCommunityOp;
exports.buildUpdateProposalOp = buildUpdateProposalOp;
exports.buildVoteOp = buildVoteOp;
exports.buildWithdrawVestingOp = buildWithdrawVestingOp;
exports.buildWitnessProxyOp = buildWitnessProxyOp;
exports.buildWitnessVoteOp = buildWitnessVoteOp;
exports.checkFavouriteQueryOptions = checkFavouriteQueryOptions;
exports.checkUsernameWalletsPendingQueryOptions = checkUsernameWalletsPendingQueryOptions;
exports.decodeObj = decodeObj;
exports.dedupeAndSortKeyAuths = dedupeAndSortKeyAuths;
exports.deleteDraft = deleteDraft;
exports.deleteImage = deleteImage;
exports.deleteSchedule = deleteSchedule;
exports.downVotingPower = downVotingPower;
exports.encodeObj = encodeObj;
exports.extractAccountProfile = extractAccountProfile;
exports.formatError = formatError;
exports.formattedNumber = formattedNumber;
exports.getAccountFullQueryOptions = getAccountFullQueryOptions;
exports.getAccountNotificationsInfiniteQueryOptions = getAccountNotificationsInfiniteQueryOptions;
exports.getAccountPendingRecoveryQueryOptions = getAccountPendingRecoveryQueryOptions;
exports.getAccountPosts = getAccountPosts;
exports.getAccountPostsInfiniteQueryOptions = getAccountPostsInfiniteQueryOptions;
exports.getAccountPostsQueryOptions = getAccountPostsQueryOptions;
exports.getAccountRcQueryOptions = getAccountRcQueryOptions;
exports.getAccountRecoveriesQueryOptions = getAccountRecoveriesQueryOptions;
exports.getAccountReputationsQueryOptions = getAccountReputationsQueryOptions;
exports.getAccountSubscriptionsQueryOptions = getAccountSubscriptionsQueryOptions;
exports.getAccountVoteHistoryInfiniteQueryOptions = getAccountVoteHistoryInfiniteQueryOptions;
exports.getAccountsQueryOptions = getAccountsQueryOptions;
exports.getAllHiveEngineTokensQueryOptions = getAllHiveEngineTokensQueryOptions;
exports.getAnnouncementsQueryOptions = getAnnouncementsQueryOptions;
exports.getBookmarksInfiniteQueryOptions = getBookmarksInfiniteQueryOptions;
exports.getBookmarksQueryOptions = getBookmarksQueryOptions;
exports.getBoostPlusAccountPricesQueryOptions = getBoostPlusAccountPricesQueryOptions;
exports.getBoostPlusPricesQueryOptions = getBoostPlusPricesQueryOptions;
exports.getBotsQueryOptions = getBotsQueryOptions;
exports.getBoundFetch = getBoundFetch;
exports.getChainPropertiesQueryOptions = getChainPropertiesQueryOptions;
exports.getCollateralizedConversionRequestsQueryOptions = getCollateralizedConversionRequestsQueryOptions;
exports.getCommentHistoryQueryOptions = getCommentHistoryQueryOptions;
exports.getCommunities = getCommunities;
exports.getCommunitiesQueryOptions = getCommunitiesQueryOptions;
exports.getCommunity = getCommunity;
exports.getCommunityContextQueryOptions = getCommunityContextQueryOptions;
exports.getCommunityPermissions = getCommunityPermissions;
exports.getCommunityQueryOptions = getCommunityQueryOptions;
exports.getCommunitySubscribersQueryOptions = getCommunitySubscribersQueryOptions;
exports.getCommunityType = getCommunityType;
exports.getContentQueryOptions = getContentQueryOptions;
exports.getContentRepliesQueryOptions = getContentRepliesQueryOptions;
exports.getControversialRisingInfiniteQueryOptions = getControversialRisingInfiniteQueryOptions;
exports.getConversionRequestsQueryOptions = getConversionRequestsQueryOptions;
exports.getCurrencyRate = getCurrencyRate;
exports.getCurrencyRates = getCurrencyRates;
exports.getCurrencyTokenRate = getCurrencyTokenRate;
exports.getCurrentMedianHistoryPriceQueryOptions = getCurrentMedianHistoryPriceQueryOptions;
exports.getCustomJsonAuthority = getCustomJsonAuthority;
exports.getDeletedEntryQueryOptions = getDeletedEntryQueryOptions;
exports.getDiscoverCurationQueryOptions = getDiscoverCurationQueryOptions;
exports.getDiscoverLeaderboardQueryOptions = getDiscoverLeaderboardQueryOptions;
exports.getDiscussion = getDiscussion;
exports.getDiscussionQueryOptions = getDiscussionQueryOptions;
exports.getDiscussionsQueryOptions = getDiscussionsQueryOptions;
exports.getDraftsInfiniteQueryOptions = getDraftsInfiniteQueryOptions;
exports.getDraftsQueryOptions = getDraftsQueryOptions;
exports.getDynamicPropsQueryOptions = getDynamicPropsQueryOptions;
exports.getEntryActiveVotesQueryOptions = getEntryActiveVotesQueryOptions;
exports.getFavouritesInfiniteQueryOptions = getFavouritesInfiniteQueryOptions;
exports.getFavouritesQueryOptions = getFavouritesQueryOptions;
exports.getFeedHistoryQueryOptions = getFeedHistoryQueryOptions;
exports.getFollowCountQueryOptions = getFollowCountQueryOptions;
exports.getFollowersQueryOptions = getFollowersQueryOptions;
exports.getFollowingQueryOptions = getFollowingQueryOptions;
exports.getFragmentsInfiniteQueryOptions = getFragmentsInfiniteQueryOptions;
exports.getFragmentsQueryOptions = getFragmentsQueryOptions;
exports.getFriendsInfiniteQueryOptions = getFriendsInfiniteQueryOptions;
exports.getGalleryImagesQueryOptions = getGalleryImagesQueryOptions;
exports.getGameStatusCheckQueryOptions = getGameStatusCheckQueryOptions;
exports.getHbdAssetGeneralInfoQueryOptions = getHbdAssetGeneralInfoQueryOptions;
exports.getHbdAssetTransactionsQueryOptions = getHbdAssetTransactionsQueryOptions;
exports.getHiveAssetGeneralInfoQueryOptions = getHiveAssetGeneralInfoQueryOptions;
exports.getHiveAssetMetricQueryOptions = getHiveAssetMetricQueryOptions;
exports.getHiveAssetTransactionsQueryOptions = getHiveAssetTransactionsQueryOptions;
exports.getHiveAssetWithdrawalRoutesQueryOptions = getHiveAssetWithdrawalRoutesQueryOptions;
exports.getHiveEngineBalancesWithUsdQueryOptions = getHiveEngineBalancesWithUsdQueryOptions;
exports.getHiveEngineMetrics = getHiveEngineMetrics;
exports.getHiveEngineOpenOrders = getHiveEngineOpenOrders;
exports.getHiveEngineOrderBook = getHiveEngineOrderBook;
exports.getHiveEngineTokenGeneralInfoQueryOptions = getHiveEngineTokenGeneralInfoQueryOptions;
exports.getHiveEngineTokenMetrics = getHiveEngineTokenMetrics;
exports.getHiveEngineTokenTransactions = getHiveEngineTokenTransactions;
exports.getHiveEngineTokenTransactionsQueryOptions = getHiveEngineTokenTransactionsQueryOptions;
exports.getHiveEngineTokensBalances = getHiveEngineTokensBalances;
exports.getHiveEngineTokensBalancesQueryOptions = getHiveEngineTokensBalancesQueryOptions;
exports.getHiveEngineTokensMarket = getHiveEngineTokensMarket;
exports.getHiveEngineTokensMarketQueryOptions = getHiveEngineTokensMarketQueryOptions;
exports.getHiveEngineTokensMetadata = getHiveEngineTokensMetadata;
exports.getHiveEngineTokensMetadataQueryOptions = getHiveEngineTokensMetadataQueryOptions;
exports.getHiveEngineTokensMetricsQueryOptions = getHiveEngineTokensMetricsQueryOptions;
exports.getHiveEngineTradeHistory = getHiveEngineTradeHistory;
exports.getHiveEngineUnclaimedRewards = getHiveEngineUnclaimedRewards;
exports.getHiveEngineUnclaimedRewardsQueryOptions = getHiveEngineUnclaimedRewardsQueryOptions;
exports.getHiveHbdStatsQueryOptions = getHiveHbdStatsQueryOptions;
exports.getHivePoshLinksQueryOptions = getHivePoshLinksQueryOptions;
exports.getHivePowerAssetGeneralInfoQueryOptions = getHivePowerAssetGeneralInfoQueryOptions;
exports.getHivePowerAssetTransactionsQueryOptions = getHivePowerAssetTransactionsQueryOptions;
exports.getHivePowerDelegatesInfiniteQueryOptions = getHivePowerDelegatesInfiniteQueryOptions;
exports.getHivePowerDelegatingsQueryOptions = getHivePowerDelegatingsQueryOptions;
exports.getHivePrice = getHivePrice;
exports.getImagesInfiniteQueryOptions = getImagesInfiniteQueryOptions;
exports.getImagesQueryOptions = getImagesQueryOptions;
exports.getIncomingRcQueryOptions = getIncomingRcQueryOptions;
exports.getLarynxAssetGeneralInfoQueryOptions = getLarynxAssetGeneralInfoQueryOptions;
exports.getLarynxPowerAssetGeneralInfoQueryOptions = getLarynxPowerAssetGeneralInfoQueryOptions;
exports.getMarketData = getMarketData;
exports.getMarketDataQueryOptions = getMarketDataQueryOptions;
exports.getMarketHistoryQueryOptions = getMarketHistoryQueryOptions;
exports.getMarketStatisticsQueryOptions = getMarketStatisticsQueryOptions;
exports.getMutedUsersQueryOptions = getMutedUsersQueryOptions;
exports.getNormalizePostQueryOptions = getNormalizePostQueryOptions;
exports.getNotificationSetting = getNotificationSetting;
exports.getNotifications = getNotifications;
exports.getNotificationsInfiniteQueryOptions = getNotificationsInfiniteQueryOptions;
exports.getNotificationsSettingsQueryOptions = getNotificationsSettingsQueryOptions;
exports.getNotificationsUnreadCountQueryOptions = getNotificationsUnreadCountQueryOptions;
exports.getOpenOrdersQueryOptions = getOpenOrdersQueryOptions;
exports.getOperationAuthority = getOperationAuthority;
exports.getOrderBookQueryOptions = getOrderBookQueryOptions;
exports.getOutgoingRcDelegationsInfiniteQueryOptions = getOutgoingRcDelegationsInfiniteQueryOptions;
exports.getPageStatsQueryOptions = getPageStatsQueryOptions;
exports.getPointsAssetGeneralInfoQueryOptions = getPointsAssetGeneralInfoQueryOptions;
exports.getPointsAssetTransactionsQueryOptions = getPointsAssetTransactionsQueryOptions;
exports.getPointsQueryOptions = getPointsQueryOptions;
exports.getPortfolioQueryOptions = getPortfolioQueryOptions;
exports.getPost = getPost;
exports.getPostHeader = getPostHeader;
exports.getPostHeaderQueryOptions = getPostHeaderQueryOptions;
exports.getPostQueryOptions = getPostQueryOptions;
exports.getPostTipsQueryOptions = getPostTipsQueryOptions;
exports.getPostsRanked = getPostsRanked;
exports.getPostsRankedInfiniteQueryOptions = getPostsRankedInfiniteQueryOptions;
exports.getPostsRankedQueryOptions = getPostsRankedQueryOptions;
exports.getProfiles = getProfiles;
exports.getProfilesQueryOptions = getProfilesQueryOptions;
exports.getPromotePriceQueryOptions = getPromotePriceQueryOptions;
exports.getPromotedPost = getPromotedPost;
exports.getPromotedPostsQuery = getPromotedPostsQuery;
exports.getProposalAuthority = getProposalAuthority;
exports.getProposalQueryOptions = getProposalQueryOptions;
exports.getProposalVotesInfiniteQueryOptions = getProposalVotesInfiniteQueryOptions;
exports.getProposalsQueryOptions = getProposalsQueryOptions;
exports.getQueryClient = getQueryClient;
exports.getRcStatsQueryOptions = getRcStatsQueryOptions;
exports.getRebloggedByQueryOptions = getRebloggedByQueryOptions;
exports.getReblogsQueryOptions = getReblogsQueryOptions;
exports.getReceivedVestingSharesQueryOptions = getReceivedVestingSharesQueryOptions;
exports.getRecurrentTransfersQueryOptions = getRecurrentTransfersQueryOptions;
exports.getReferralsInfiniteQueryOptions = getReferralsInfiniteQueryOptions;
exports.getReferralsStatsQueryOptions = getReferralsStatsQueryOptions;
exports.getRelationshipBetweenAccounts = getRelationshipBetweenAccounts;
exports.getRelationshipBetweenAccountsQueryOptions = getRelationshipBetweenAccountsQueryOptions;
exports.getRequiredAuthority = getRequiredAuthority;
exports.getRewardFundQueryOptions = getRewardFundQueryOptions;
exports.getRewardedCommunitiesQueryOptions = getRewardedCommunitiesQueryOptions;
exports.getSavingsWithdrawFromQueryOptions = getSavingsWithdrawFromQueryOptions;
exports.getSchedulesInfiniteQueryOptions = getSchedulesInfiniteQueryOptions;
exports.getSchedulesQueryOptions = getSchedulesQueryOptions;
exports.getSearchAccountQueryOptions = getSearchAccountQueryOptions;
exports.getSearchAccountsByUsernameQueryOptions = getSearchAccountsByUsernameQueryOptions;
exports.getSearchApiInfiniteQueryOptions = getSearchApiInfiniteQueryOptions;
exports.getSearchFriendsQueryOptions = getSearchFriendsQueryOptions;
exports.getSearchPathQueryOptions = getSearchPathQueryOptions;
exports.getSearchTopicsQueryOptions = getSearchTopicsQueryOptions;
exports.getSimilarEntriesQueryOptions = getSimilarEntriesQueryOptions;
exports.getSpkAssetGeneralInfoQueryOptions = getSpkAssetGeneralInfoQueryOptions;
exports.getSpkMarkets = getSpkMarkets;
exports.getSpkMarketsQueryOptions = getSpkMarketsQueryOptions;
exports.getSpkWallet = getSpkWallet;
exports.getSpkWalletQueryOptions = getSpkWalletQueryOptions;
exports.getStatsQueryOptions = getStatsQueryOptions;
exports.getSubscribers = getSubscribers;
exports.getSubscriptions = getSubscriptions;
exports.getTradeHistoryQueryOptions = getTradeHistoryQueryOptions;
exports.getTransactionsInfiniteQueryOptions = getTransactionsInfiniteQueryOptions;
exports.getTrendingTagsQueryOptions = getTrendingTagsQueryOptions;
exports.getTrendingTagsWithStatsQueryOptions = getTrendingTagsWithStatsQueryOptions;
exports.getUserPostVoteQueryOptions = getUserPostVoteQueryOptions;
exports.getUserProposalVotesQueryOptions = getUserProposalVotesQueryOptions;
exports.getVestingDelegationsQueryOptions = getVestingDelegationsQueryOptions;
exports.getVisibleFirstLevelThreadItems = getVisibleFirstLevelThreadItems;
exports.getWavesByHostQueryOptions = getWavesByHostQueryOptions;
exports.getWavesByTagQueryOptions = getWavesByTagQueryOptions;
exports.getWavesFollowingQueryOptions = getWavesFollowingQueryOptions;
exports.getWavesTrendingTagsQueryOptions = getWavesTrendingTagsQueryOptions;
exports.getWithdrawRoutesQueryOptions = getWithdrawRoutesQueryOptions;
exports.getWitnessesInfiniteQueryOptions = getWitnessesInfiniteQueryOptions;
exports.hsTokenRenew = hsTokenRenew;
exports.isCommunity = isCommunity;
exports.isEmptyDate = isEmptyDate;
exports.isInfoError = isInfoError;
exports.isNetworkError = isNetworkError;
exports.isResourceCreditsError = isResourceCreditsError;
exports.isWrappedResponse = isWrappedResponse;
exports.lookupAccountsQueryOptions = lookupAccountsQueryOptions;
exports.makeQueryClient = makeQueryClient;
exports.mapThreadItemsToWaveEntries = mapThreadItemsToWaveEntries;
exports.markNotifications = markNotifications;
exports.moveSchedule = moveSchedule;
exports.normalizePost = normalizePost;
exports.normalizeToWrappedResponse = normalizeToWrappedResponse;
exports.normalizeWaveEntryFromApi = normalizeWaveEntryFromApi;
exports.onboardEmail = onboardEmail;
exports.parseAccounts = parseAccounts;
exports.parseAsset = parseAsset;
exports.parseChainError = parseChainError;
exports.parseProfileMetadata = parseProfileMetadata;
exports.powerRechargeTime = powerRechargeTime;
exports.rcPower = rcPower;
exports.removeOptimisticDiscussionEntry = removeOptimisticDiscussionEntry;
exports.resolveHiveOperationFilters = resolveHiveOperationFilters;
exports.resolvePost = resolvePost;
exports.restoreDiscussionSnapshots = restoreDiscussionSnapshots;
exports.restoreEntryInCache = restoreEntryInCache;
exports.rewardSpk = rewardSpk;
exports.roleMap = roleMap;
exports.saveNotificationSetting = saveNotificationSetting;
exports.search = search;
exports.searchAccount = searchAccount;
exports.searchPath = searchPath;
exports.searchQueryOptions = searchQueryOptions;
exports.searchTag = searchTag;
exports.shouldTriggerAuthFallback = shouldTriggerAuthFallback;
exports.signUp = signUp;
exports.sortDiscussions = sortDiscussions;
exports.subscribeEmail = subscribeEmail;
exports.toEntryArray = toEntryArray;
exports.updateDraft = updateDraft;
exports.updateEntryInCache = updateEntryInCache;
exports.uploadImage = uploadImage;
exports.useAccountFavouriteAdd = useAccountFavouriteAdd;
exports.useAccountFavouriteDelete = useAccountFavouriteDelete;
exports.useAccountRelationsUpdate = useAccountRelationsUpdate;
exports.useAccountRevokeKey = useAccountRevokeKey;
exports.useAccountRevokePosting = useAccountRevokePosting;
exports.useAccountUpdate = useAccountUpdate;
exports.useAccountUpdateKeyAuths = useAccountUpdateKeyAuths;
exports.useAccountUpdatePassword = useAccountUpdatePassword;
exports.useAccountUpdateRecovery = useAccountUpdateRecovery;
exports.useAddDraft = useAddDraft;
exports.useAddFragment = useAddFragment;
exports.useAddImage = useAddImage;
exports.useAddSchedule = useAddSchedule;
exports.useBookmarkAdd = useBookmarkAdd;
exports.useBookmarkDelete = useBookmarkDelete;
exports.useBroadcastMutation = useBroadcastMutation;
exports.useClaimAccount = useClaimAccount;
exports.useClaimEngineRewards = useClaimEngineRewards;
exports.useClaimInterest = useClaimInterest;
exports.useClaimPoints = useClaimPoints;
exports.useClaimRewards = useClaimRewards;
exports.useComment = useComment;
exports.useConvert = useConvert;
exports.useCrossPost = useCrossPost;
exports.useDelegateEngineToken = useDelegateEngineToken;
exports.useDelegateVestingShares = useDelegateVestingShares;
exports.useDeleteComment = useDeleteComment;
exports.useDeleteDraft = useDeleteDraft;
exports.useDeleteImage = useDeleteImage;
exports.useDeleteSchedule = useDeleteSchedule;
exports.useEditFragment = useEditFragment;
exports.useEngineMarketOrder = useEngineMarketOrder;
exports.useFollow = useFollow;
exports.useGameClaim = useGameClaim;
exports.useLockLarynx = useLockLarynx;
exports.useMarkNotificationsRead = useMarkNotificationsRead;
exports.useMoveSchedule = useMoveSchedule;
exports.useMutePost = useMutePost;
exports.usePowerLarynx = usePowerLarynx;
exports.usePromote = usePromote;
exports.useProposalVote = useProposalVote;
exports.useReblog = useReblog;
exports.useRecordActivity = useRecordActivity;
exports.useRegisterCommunityRewards = useRegisterCommunityRewards;
exports.useRemoveFragment = useRemoveFragment;
exports.useSetCommunityRole = useSetCommunityRole;
exports.useSetWithdrawVestingRoute = useSetWithdrawVestingRoute;
exports.useSignOperationByHivesigner = useSignOperationByHivesigner;
exports.useSignOperationByKey = useSignOperationByKey;
exports.useSignOperationByKeychain = useSignOperationByKeychain;
exports.useStakeEngineToken = useStakeEngineToken;
exports.useSubscribeCommunity = useSubscribeCommunity;
exports.useTransfer = useTransfer;
exports.useTransferEngineToken = useTransferEngineToken;
exports.useTransferFromSavings = useTransferFromSavings;
exports.useTransferLarynx = useTransferLarynx;
exports.useTransferPoint = useTransferPoint;
exports.useTransferSpk = useTransferSpk;
exports.useTransferToSavings = useTransferToSavings;
exports.useTransferToVesting = useTransferToVesting;
exports.useUndelegateEngineToken = useUndelegateEngineToken;
exports.useUnfollow = useUnfollow;
exports.useUnstakeEngineToken = useUnstakeEngineToken;
exports.useUnsubscribeCommunity = useUnsubscribeCommunity;
exports.useUpdateCommunity = useUpdateCommunity;
exports.useUpdateDraft = useUpdateDraft;
exports.useUpdateReply = useUpdateReply;
exports.useUploadImage = useUploadImage;
exports.useVote = useVote;
exports.useWalletOperation = useWalletOperation;
exports.useWithdrawVesting = useWithdrawVesting;
exports.useWitnessVote = useWitnessVote;
exports.usrActivity = usrActivity;
exports.validatePostCreating = validatePostCreating;
exports.vestsToHp = vestsToHp;
exports.votingPower = votingPower;
exports.votingValue = votingValue;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map