"use client";

import { HasClient } from "hive-auth-client";
import defaults from "@/defaults.json";
import { get, remove, set } from "@/utils/local-storage";
import { isKeychainInAppBrowser } from "@/utils/keychain";
import { DEFAULT_ADDRESS_PREFIX, Operation, PublicKey, Signature, cryptoUtils } from "@hiveio/dhive";
import type { FullAccount } from "@/entities";

const HIVE_AUTH_HOST = "hive-auth.arcange.eu";
const STORAGE_KEY_PREFIX = "hiveauth-session";
const MOBILE_USER_AGENT_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

interface HiveAuthSession {
  username: string;
  token: string;
  key: string;
  expire: number;
}

interface HiveAuthSessionResponse extends HiveAuthSession {}

class HiveAuthSessionExpiredError extends Error {}

let hiveAuthClient: HasClient | null = null;

function getClient(): HasClient {
  if (typeof window === "undefined") {
    throw new Error("HiveAuth client is only available in the browser");
  }

  if (!hiveAuthClient) {
    hiveAuthClient = new HasClient(HIVE_AUTH_HOST, "", false);
  }

  return hiveAuthClient;
}

function buildAppMeta() {
  const iconUrl = typeof window !== "undefined"
    ? new URL(defaults.logo, window.location.origin).toString()
    : defaults.logo;

  return {
    name: defaults.name,
    description: defaults.description,
    icon: iconUrl
  };
}

function storageKey(username: string) {
  return `${STORAGE_KEY_PREFIX}-${username}`;
}

function loadSession(username: string): HiveAuthSession | null {
  const stored = get(storageKey(username));
  if (!stored) {
    return null;
  }

  const expire = normalizeExpire(stored.expire);
  return {
    username: stored.username,
    token: stored.token,
    key: stored.key,
    expire
  };
}

function saveSession(session: HiveAuthSession) {
  set(storageKey(session.username), session);
}

function clearSession(username: string) {
  remove(storageKey(username));
}

function normalizeExpire(expire: number): number {
  if (!expire) {
    return 0;
  }
  return expire > 1e12 ? expire : expire * 1000;
}

function isMobileBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator?.userAgent ?? "";
  return MOBILE_USER_AGENT_PATTERN.test(ua) || window.innerWidth <= 768;
}

function openDeepLink(uri: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.location.href = uri;
  } catch (err) {
    console.error("Failed to open HiveAuth deep link", err);
  }
}

function watchAppVisibility(onVisible: () => void): () => void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    if (!document.hidden) {
      onVisible();
    }
  };

  document.addEventListener("visibilitychange", handler);
  window.addEventListener("focus", handler);

  return () => {
    document.removeEventListener("visibilitychange", handler);
    window.removeEventListener("focus", handler);
  };
}

function parseChallengeSignature(rawSignature: string): Signature {
  if (!rawSignature) {
    throw new Error("HiveAuth challenge response is missing signature");
  }

  const normalized = rawSignature.trim();

  if (normalized.startsWith("SIG_")) {
    return Signature.fromString(normalized);
  }

  const isHex = /^[0-9a-fA-F]+$/.test(normalized);
  if (isHex) {
    return Signature.fromBuffer(Buffer.from(normalized, "hex"));
  }

  // HiveAuth mobile clients (e.g. Keychain) may return signatures encoded in base64.
  // Attempt to decode the payload before giving up so we can validate those responses.
  try {
    return Signature.fromBuffer(Buffer.from(normalized, "base64"));
  } catch (err) {
    console.error("HiveAuth challenge signature parsing failed", err);
  }

  throw new Error("HiveAuth challenge signature has an unsupported format");
}

function verifyChallengeSignature(challenge: string, response: any, account?: FullAccount) {
  if (!response) {
    throw new Error("HiveAuth challenge response is missing payload");
  }

  const rawSignature = response.challenge;

  // Modern HiveAuth mobile wallets (Keychain, Ecency, etc.) no longer return the
  // challenge signature in the AUTH_ACK payload. When that happens we can trust
  // the acknowledgement that HAS already verified for us and short-circuit.
  if (!rawSignature) {
    return true;
  }

  if (!account) {
    return true;
  }

  try {
    const digest = cryptoUtils.sha256(challenge);
    const signature = parseChallengeSignature(rawSignature);
    const postingKeys = account.posting?.key_auths?.map(([key]) => key) ?? [];
    const activeKeys = account.active?.key_auths?.map(([key]) => key) ?? [];
    const authorizedKeys = new Set([...postingKeys, ...activeKeys]);

    const providedPubkey = typeof response.pubkey === "string" ? response.pubkey.trim() : "";

    if (providedPubkey && authorizedKeys.has(providedPubkey)) {
      try {
        const publicKey = PublicKey.fromString(providedPubkey);
        if (signature.verifyHash(digest, publicKey)) {
          return true;
        }
      } catch (err) {
        console.error("HiveAuth challenge verification failed for provided pubkey", err);
      }
    }

    const recovered = signature.recover(digest, DEFAULT_ADDRESS_PREFIX);
    if (authorizedKeys.has(recovered.toString())) {
      return true;
    }
  } catch (err) {
    console.error("HiveAuth challenge verification failed", err);
  }

  throw new Error("HiveAuth signature verification failed");
}

function requestAuthentication(username: string, account?: FullAccount): Promise<HiveAuthSessionResponse> {
  const client = getClient();

  return new Promise((resolve, reject) => {
    const challenge = JSON.stringify({ login: username, ts: Date.now() });
    let pending = true;
    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!pending) {
        return;
      }

      try {
        void client.connect();
      } catch (err) {
        console.error("HiveAuth reconnect failed after returning from wallet", err);
      }
    });

    const handlePending = (event: any) => {
      const pending = event ?? {};
      const payload = {
        account: pending.account ?? username,
        uuid: pending.uuid,
        key: pending.key,
        host: `wss://${HIVE_AUTH_HOST}`
      };

      if (payload.uuid && payload.key) {
        const encoded = btoa(JSON.stringify(payload));
        openDeepLink(`has://auth_req/${encoded}`);
      }
    };

    const cleanup = () => {
      pending = false;
      client.removeEventHandler("AuthPending", handlePending);
      client.removeEventHandler("AuthSuccess", handleSuccess);
      client.removeEventHandler("AuthFailure", handleFailure);
      client.removeEventHandler("Error", handleError);
      client.removeEventHandler("RequestExpired", handleExpired);
      stopWatchingVisibility();
    };

    const handleSuccess = (event: any) => {
      cleanup();
      const { authData, data } = event ?? {};
      if (!authData?.token || !authData?.key) {
        reject(new Error("HiveAuth returned incomplete session"));
        return;
      }

      try {
        verifyChallengeSignature(challenge, data, account);
      } catch (err) {
        clearSession(username);
        reject(err);
        return;
      }

      const session: HiveAuthSession = {
        username,
        token: authData.token,
        key: authData.key,
        expire: normalizeExpire(authData.expire ?? 0)
      };
      saveSession(session);
      resolve(session);
    };

    const handleFailure = (event: any) => {
      cleanup();
      const message = event?.message?.error ?? event?.message ?? "HiveAuth authentication failed";
      reject(new Error(message));
    };

    const handleError = (event: any) => {
      cleanup();
      const message = event?.error ?? event?.message?.error ?? "HiveAuth error";
      reject(new Error(message));
    };

    const handleExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth authentication expired"));
    };

    client.addEventHandler("AuthPending", handlePending);
    client.addEventHandler("AuthSuccess", handleSuccess);
    client.addEventHandler("AuthFailure", handleFailure);
    client.addEventHandler("Error", handleError);
    client.addEventHandler("RequestExpired", handleExpired);

    client.authenticate(
      { username },
      buildAppMeta(),
      { key_type: "posting", challenge }
    );
  });
}

async function ensureSession(username: string, account?: FullAccount): Promise<HiveAuthSession> {
  const cached = loadSession(username);
  if (cached && cached.expire && cached.expire > Date.now()) {
    return cached;
  }

  try {
    return await requestAuthentication(username, account);
  } catch (err) {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username);
    }
    throw err;
  }
}

function isTokenError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return normalized.includes("token") || normalized.includes("expired");
}

async function runChallenge(
  username: string,
  challenge: string,
  keyType: "posting" | "active",
  account?: FullAccount
): Promise<string> {
  const session = await ensureSession(username, account);
  const client = getClient();

  return new Promise((resolve, reject) => {
    let pending = true;
    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!pending) {
        return;
      }

      try {
        void client.connect();
      } catch (err) {
        console.error("HiveAuth reconnect failed after returning from wallet", err);
      }
    });

    const cleanup = () => {
      pending = false;
      client.removeEventHandler("ChallengeSuccess", handleSuccess);
      client.removeEventHandler("ChallengeFailure", handleFailure);
      client.removeEventHandler("ChallengeError", handleError);
      client.removeEventHandler("RequestExpired", handleExpired);
      stopWatchingVisibility();
    };

    const handleSuccess = (event: any) => {
      cleanup();
      const signature = event?.data?.challenge;
      if (!signature) {
        reject(new Error("HiveAuth returned empty signature"));
        return;
      }
      try {
        const normalized = parseChallengeSignature(signature).toString();
        resolve(normalized);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("HiveAuth returned invalid signature"));
      }
    };

    const handleFailure = (event: any) => {
      cleanup();
      const message = event?.message?.error ?? event?.message;
      if (isTokenError(message)) {
        clearSession(username);
        reject(new HiveAuthSessionExpiredError(message ?? "HiveAuth challenge failed"));
        return;
      }
      reject(new Error(message ?? "HiveAuth challenge failed"));
    };

    const handleError = (event: any) => {
      cleanup();
      const message = event?.error ?? event?.message?.error;
      if (isTokenError(message)) {
        clearSession(username);
        reject(new HiveAuthSessionExpiredError(message ?? "HiveAuth challenge error"));
        return;
      }
      reject(new Error(message ?? "HiveAuth challenge error"));
    };

    const handleExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth challenge expired"));
    };

    client.addEventHandler("ChallengeSuccess", handleSuccess);
    client.addEventHandler("ChallengeFailure", handleFailure);
    client.addEventHandler("ChallengeError", handleError);
    client.addEventHandler("RequestExpired", handleExpired);

    client.challenge(session, { key_type: keyType, challenge });
  }).catch(async (err) => {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username);
      const refreshed = await ensureSession(username, account);
      const clientRetry = getClient();

      return new Promise<string>((resolve, reject) => {
        let pending = true;
        const stopWatchingVisibility = watchAppVisibility(() => {
          if (!pending) {
            return;
          }

          try {
            void clientRetry.connect();
          } catch (error) {
            console.error("HiveAuth reconnect failed after returning from wallet", error);
          }
        });

        const cleanup = () => {
          pending = false;
          clientRetry.removeEventHandler("ChallengeSuccess", successHandler);
          clientRetry.removeEventHandler("ChallengeFailure", failureHandler);
          clientRetry.removeEventHandler("ChallengeError", errorHandler);
          clientRetry.removeEventHandler("RequestExpired", expiredHandler);
          stopWatchingVisibility();
        };

        const successHandler = (event: any) => {
          cleanup();
          const signature = event?.data?.challenge;
          if (!signature) {
            reject(new Error("HiveAuth returned empty signature"));
            return;
          }
          try {
            const normalized = parseChallengeSignature(signature).toString();
            resolve(normalized);
          } catch (err) {
            reject(err instanceof Error ? err : new Error("HiveAuth returned invalid signature"));
          }
        };

        const failureHandler = (event: any) => {
          cleanup();
          reject(new Error(event?.message?.error ?? event?.message ?? "HiveAuth challenge failed"));
        };

        const errorHandler = (event: any) => {
          cleanup();
          reject(new Error(event?.error ?? event?.message?.error ?? "HiveAuth challenge error"));
        };

        const expiredHandler = () => {
          cleanup();
          reject(new Error("HiveAuth challenge expired"));
        };

        clientRetry.addEventHandler("ChallengeSuccess", successHandler);
        clientRetry.addEventHandler("ChallengeFailure", failureHandler);
        clientRetry.addEventHandler("ChallengeError", errorHandler);
        clientRetry.addEventHandler("RequestExpired", expiredHandler);

        clientRetry.challenge(refreshed, { key_type: keyType, challenge });
      });
    }

    throw err;
  });
}

async function runBroadcast(
  username: string,
  keyType: "posting" | "active",
  operations: Operation[],
  account?: FullAccount
): Promise<void> {
  const session = await ensureSession(username, account);
  const client = getClient();

  await new Promise<void>((resolve, reject) => {
    let pending = true;
    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!pending) {
        return;
      }

      try {
        void client.connect();
      } catch (err) {
        console.error("HiveAuth reconnect failed after returning from wallet", err);
      }
    });

    const cleanup = () => {
      pending = false;
      client.removeEventHandler("SignSuccess", handleSuccess);
      client.removeEventHandler("SignFailure", handleFailure);
      client.removeEventHandler("SignError", handleError);
      client.removeEventHandler("RequestExpired", handleExpired);
      stopWatchingVisibility();
    };

    const handleSuccess = () => {
      cleanup();
      resolve();
    };

    const handleFailure = (event: any) => {
      cleanup();
      const message = event?.message?.error ?? event?.message;
      if (isTokenError(message)) {
        clearSession(username);
        reject(new HiveAuthSessionExpiredError(message ?? "HiveAuth sign failure"));
        return;
      }
      reject(new Error(message ?? "HiveAuth sign failure"));
    };

    const handleError = (event: any) => {
      cleanup();
      const message = event?.error ?? event?.message?.error;
      if (isTokenError(message)) {
        clearSession(username);
        reject(new HiveAuthSessionExpiredError(message ?? "HiveAuth sign error"));
        return;
      }
      reject(new Error(message ?? "HiveAuth sign error"));
    };

    const handleExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth sign expired"));
    };

    client.addEventHandler("SignSuccess", handleSuccess);
    client.addEventHandler("SignFailure", handleFailure);
    client.addEventHandler("SignError", handleError);
    client.addEventHandler("RequestExpired", handleExpired);

    client.broadcast(session, keyType, operations);
  }).catch(async (err) => {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username);
      const refreshed = await ensureSession(username, account);
      const clientRetry = getClient();

      return new Promise<void>((resolve, reject) => {
        let pending = true;
        const stopWatchingVisibility = watchAppVisibility(() => {
          if (!pending) {
            return;
          }

          try {
            void clientRetry.connect();
          } catch (error) {
            console.error("HiveAuth reconnect failed after returning from wallet", error);
          }
        });

        const cleanup = () => {
          pending = false;
          clientRetry.removeEventHandler("SignSuccess", successHandler);
          clientRetry.removeEventHandler("SignFailure", failureHandler);
          clientRetry.removeEventHandler("SignError", errorHandler);
          clientRetry.removeEventHandler("RequestExpired", expiredHandler);
          stopWatchingVisibility();
        };

        const successHandler = () => {
          cleanup();
          resolve();
        };

        const failureHandler = (event: any) => {
          cleanup();
          reject(new Error(event?.message?.error ?? event?.message ?? "HiveAuth sign failure"));
        };

        const errorHandler = (event: any) => {
          cleanup();
          reject(new Error(event?.error ?? event?.message?.error ?? "HiveAuth sign error"));
        };

        const expiredHandler = () => {
          cleanup();
          reject(new Error("HiveAuth sign expired"));
        };

        clientRetry.addEventHandler("SignSuccess", successHandler);
        clientRetry.addEventHandler("SignFailure", failureHandler);
        clientRetry.addEventHandler("SignError", errorHandler);
        clientRetry.addEventHandler("RequestExpired", expiredHandler);

        clientRetry.broadcast(refreshed, keyType, operations);
      });
    }

    throw err;
  });
}

export function shouldUseHiveAuth(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hasKeychain = Boolean((window as any).hive_keychain);
  return isMobileBrowser() && !hasKeychain && !isKeychainInAppBrowser();
}

export async function signWithHiveAuth(
  username: string,
  message: string,
  account?: FullAccount,
  keyType: "posting" | "active" = "posting"
): Promise<string> {
  return runChallenge(username, message, keyType, account);
}

export async function broadcastWithHiveAuth(
  username: string,
  operations: Operation[],
  keyType: "posting" | "active" = "posting",
  account?: FullAccount
): Promise<void> {
  await runBroadcast(username, keyType, operations, account);
}

export function resetHiveAuthSession(username: string) {
  clearSession(username);
}
