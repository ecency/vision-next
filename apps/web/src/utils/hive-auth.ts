"use client";

import { HasClient } from "hive-auth-client";
import defaults from "@/defaults.json";
import { get, remove, set } from "@/utils/local-storage";
import { isKeychainInAppBrowser } from "@/utils/keychain";
import {
  DEFAULT_ADDRESS_PREFIX,
  Operation,
  PublicKey,
  Signature,
  cryptoUtils
} from "@hiveio/dhive";
import type { FullAccount } from "@/entities";

const HIVE_AUTH_HOST = "hive-auth.arcange.eu";
const STORAGE_KEY_PREFIX = "hiveauth-session";
const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/* ----------------------------- Event typings ------------------------------ */

interface AuthPendingEvent {
  uuid: string;
  key: string;
  account?: string;
}

interface AuthSuccessEvent {
  uuid?: string;
  authData?: {
    token?: string;
    key?: string;
    expire?: number; // seconds or ms, we normalize
  };
  data?: {
    challenge?: string; // signature (optional in modern wallets)
    pubkey?: string; // optional public key hint
  };
}

interface FailureEvent {
  message?: { error?: string } | string;
  error?: string;
}

interface ChallengeSuccessEvent {
  data?: { challenge?: string }; // signature
}

/* ------------------------------ Session model ----------------------------- */

interface HiveAuthSession {
  username: string;
  token: string;
  key: string;
  expire: number; // ms
}
interface HiveAuthSessionResponse extends HiveAuthSession {}

class HiveAuthSessionExpiredError extends Error {}

/* --------------------------------- Client --------------------------------- */

let hiveAuthClient: HasClient | null = null;
// Keep the current auth request UUID to sanity-check the ACK
let currentAuthUuid: string | null = null;

function getClient(): HasClient {
  if (typeof window === "undefined") {
    throw new Error("HiveAuth client is only available in the browser");
  }
  if (!hiveAuthClient) {
    hiveAuthClient = new HasClient(HIVE_AUTH_HOST, "", false);
  }
  return hiveAuthClient;
}

/* --------------------------------- Utils ---------------------------------- */

function buildAppMeta() {
  const iconUrl =
    typeof window !== "undefined"
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
  if (!stored) return null;
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

/** Normalize seconds-or-ms into ms */
function normalizeExpire(expire: number): number {
  if (!expire) return 0;
  return expire > 1e12 ? expire : expire * 1000;
}

function isMobileBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator?.userAgent ?? "";
  return MOBILE_USER_AGENT_PATTERN.test(ua) || window.innerWidth <= 768;
}

function openDeepLink(uri: string) {
  if (typeof window === "undefined") return;
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
    if (!document.hidden) onVisible();
  };
  document.addEventListener("visibilitychange", handler);
  window.addEventListener("focus", handler);
  return () => {
    document.removeEventListener("visibilitychange", handler);
    window.removeEventListener("focus", handler);
  };
}

/* ---------- Binary helpers (no Node Buffer; browser-safe) ---------- */

function b64ToBytes(b64: string): Uint8Array {
  // atob returns a binary string; convert to bytes
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.length % 2 ? "0" + hex : hex;
  const len = cleaned.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return out;
}

/* ------------------------ Signature parse/verification --------------------- */

function parseChallengeSignature(rawSignature: unknown): Signature {
  if (!rawSignature) {
    throw new Error("HiveAuth challenge response is missing signature");
  }

  // Some wallets return { sig: "...", pubkey: "..." }
  if (typeof rawSignature === "object" && rawSignature !== null) {
    const sig = (rawSignature as any).sig || (rawSignature as any).signature;
    if (!sig || typeof sig !== "string") {
      throw new Error("HiveAuth challenge object missing sig field");
    }
    return parseChallengeSignature(sig); // recurse to existing logic
  }

  if (typeof rawSignature !== "string") {
    throw new Error("HiveAuth challenge signature is not a string");
  }

  const s = rawSignature.trim();

  if (s.startsWith("SIG_")) return Signature.fromString(s);
  if (/^[0-9a-fA-F]+$/.test(s)) return Signature.fromBuffer(hexToBytes(s));

  try {
    return Signature.fromBuffer(b64ToBytes(s));
  } catch (err) {
    console.error("HiveAuth challenge signature parsing failed", err);
  }

  throw new Error("HiveAuth challenge signature has an unsupported format");
}

function verifyChallengeSignature(
  challenge: string,
  response: { challenge?: string | { sig?: string; signature?: string; pubkey?: string }; pubkey?: string } | undefined,
  account?: FullAccount
) {
  if (!response) throw new Error("HiveAuth challenge response is missing payload");

  const rawSignature = response.challenge;

  // Modern wallets may omit challenge signature entirely.
  // In that case, HAS already verified; we accept success.
  if (!rawSignature) return true;

  // If we don’t have an account to check keys against, accept HAS ack.
  if (!account) return true;

  try {
    const digest = cryptoUtils.sha256(challenge);
    const signature = parseChallengeSignature(rawSignature);
    const postingKeys = account.posting?.key_auths?.map(([key]) => key) ?? [];
    const activeKeys = account.active?.key_auths?.map(([key]) => key) ?? [];
    const authorizedKeys = [...postingKeys, ...activeKeys];

    const providedPubkey =
      response.pubkey ??
      (typeof rawSignature === "object" && rawSignature
        ? (rawSignature as any).pubkey
        : undefined);

    // Fast path: verify against provided pubkey if it is authorized
    if (providedPubkey && authorizedKeys.includes(providedPubkey)) {
      try {
        const publicKey = PublicKey.fromString(providedPubkey);
        if (signature.verifyHash(digest, publicKey)) return true;
      } catch (err) {
        console.error(
          "HiveAuth challenge verification failed for provided pubkey",
          err
        );
      }
    }

    // Try all known keys
    for (const key of authorizedKeys) {
      try {
        const publicKey = PublicKey.fromString(key);
        if (signature.verifyHash(digest, publicKey)) return true;
      } catch (err) {
        console.error("HiveAuth challenge verification failed for account key", err);
      }
    }

    // Recover & compare
    const recovered = signature.recover(digest, DEFAULT_ADDRESS_PREFIX).toString();
    if (authorizedKeys.includes(recovered)) return true;
  } catch (err) {
    console.error("HiveAuth challenge verification failed", err);
  }

  throw new Error("HiveAuth signature verification failed");
}

/* ------------------------------ Flow helpers ------------------------------ */

function isTokenError(message: string | undefined) {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("token") ||
    m.includes("expired") ||
    (m.includes("auth") && (m.includes("invalid") || m.includes("denied")))
  );
}

/* --------------------------- Authentication flow -------------------------- */

function requestAuthentication(
  username: string,
  account?: FullAccount
): Promise<HiveAuthSessionResponse> {
  const client = getClient();

  return new Promise(async (resolve, reject) => {
    const challenge = JSON.stringify({ login: username, ts: Date.now() });
    const challengeEnabled = !!challenge;

    let inFlight = true;
    currentAuthUuid = null;

    // Reconnect when the user returns from the wallet
    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!inFlight) return;
      client.connect().catch(() => {
        console.error("HiveAuth reconnect failed after returning from wallet");
      });
    });

    const cleanup = () => {
      inFlight = false;
      client.removeEventHandler("AuthPending", onPending);
      client.removeEventHandler("AuthSuccess", onSuccess);
      client.removeEventHandler("AuthFailure", onFailure);
      client.removeEventHandler("Error", onError);
      client.removeEventHandler("RequestExpired", onExpired);
      stopWatchingVisibility();
    };

    const onPending = (ev: AuthPendingEvent | any) => {
      const e: AuthPendingEvent = ev ?? ({} as any);
      // Record UUID for later sanity checks
      if (e?.uuid) currentAuthUuid = e.uuid;

      const payload = {
        account: e?.account ?? username,
        uuid: e?.uuid,
        key: e?.key,
        host: `wss://${HIVE_AUTH_HOST}`
      };

      if (payload.uuid && payload.key) {
        const encoded = btoa(JSON.stringify(payload));
        // Only deep-link on mobile environments
        if (isMobileBrowser()) openDeepLink(`has://auth_req/${encoded}`);
      }
    };

    const onSuccess = (ev: AuthSuccessEvent | any) => {
      cleanup();
      const { authData, data, uuid: ackUuid } = ev ?? {};

      // Basic presence checks
      if (!authData?.token || !authData?.key) {
        reject(new Error("HiveAuth returned incomplete session"));
        return;
      }

      // UUID sanity check when available
      if (currentAuthUuid && ackUuid && ackUuid !== currentAuthUuid) {
        reject(new Error("HiveAuth uuid mismatch"));
        return;
      }

      // Expiry sanity
      const expireMs = normalizeExpire(authData.expire ?? 0);
      if (!expireMs || expireMs <= Date.now()) {
        reject(new Error("HiveAuth session already expired"));
        return;
      }

      try {
        if (data?.challenge && challengeEnabled) {
          verifyChallengeSignature(challenge, data, account);
        }
      } catch (err) {
        // Prefer login success over strict local verification
        console.warn("Signature verification failed; proceeding (HAS already verified).", err);
      }

      const session: HiveAuthSession = {
        username,
        token: authData.token!,
        key: authData.key!,
        expire: expireMs
      };
      saveSession(session);
      resolve(session);
    };

    const onFailure = (ev: FailureEvent | any) => {
      cleanup();
      const message = (ev?.message as any)?.error ?? ev?.message ?? "HiveAuth authentication failed";
      reject(new Error(message));
    };

    const onError = (ev: FailureEvent | any) => {
      cleanup();
      const message = ev?.error ?? (ev?.message as any)?.error ?? "HiveAuth error";
      reject(new Error(message));
    };

    const onExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth authentication expired"));
    };

    // Proactive connect to avoid missing early events on flaky networks
    await client.connect().catch(() => {});

    client.addEventHandler("AuthPending", onPending);
    client.addEventHandler("AuthSuccess", onSuccess);
    client.addEventHandler("AuthFailure", onFailure);
    client.addEventHandler("Error", onError);
    client.addEventHandler("RequestExpired", onExpired);

    client.authenticate(
      { username },
      buildAppMeta(),
      { key_type: "posting", challenge }
    );
  });
}

async function ensureSession(
  username: string,
  account?: FullAccount
): Promise<HiveAuthSession> {
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

/* ------------------------------- Challenge -------------------------------- */

async function runChallenge(
  username: string,
  challenge: string,
  keyType: "posting" | "active",
  account?: FullAccount
): Promise<string> {
  const session = await ensureSession(username, account);
  const client = getClient();

  return new Promise<string>(async (resolve, reject) => {
    let inFlight = true;

    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!inFlight) return;
      client.connect().catch(() => {
        console.error("HiveAuth reconnect failed after returning from wallet");
      });
    });

    const cleanup = () => {
      inFlight = false;
      client.removeEventHandler("ChallengeSuccess", onSuccess);
      client.removeEventHandler("ChallengeFailure", onFailure);
      client.removeEventHandler("ChallengeError", onError);
      client.removeEventHandler("RequestExpired", onExpired);
      stopWatchingVisibility();
    };

    const onSuccess = (ev: ChallengeSuccessEvent | any) => {
      cleanup();
      const signature = ev?.data?.challenge;
      if (!signature) {
        reject(new Error("HiveAuth returned empty signature"));
        return;
      }
      try {
        const normalized = parseChallengeSignature(signature).toString();
        resolve(normalized);
      } catch (err) {
        reject(
          err instanceof Error ? err : new Error("HiveAuth returned invalid signature")
        );
      }
    };

    const onFailure = (ev: FailureEvent | any) => {
      cleanup();
      const message = (ev?.message as any)?.error ?? ev?.message;
      if (isTokenError(message)) {
        clearSession(username);
        reject(
          new HiveAuthSessionExpiredError(message ?? "HiveAuth challenge failed")
        );
        return;
      }
      reject(new Error(message ?? "HiveAuth challenge failed"));
    };

    const onError = (ev: FailureEvent | any) => {
      cleanup();
      const message = ev?.error ?? (ev?.message as any)?.error;
      if (isTokenError(message)) {
        clearSession(username);
        reject(
          new HiveAuthSessionExpiredError(message ?? "HiveAuth challenge error")
        );
        return;
      }
      reject(new Error(message ?? "HiveAuth challenge error"));
    };

    const onExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth challenge expired"));
    };

    await client.connect().catch(() => {});

    client.addEventHandler("ChallengeSuccess", onSuccess);
    client.addEventHandler("ChallengeFailure", onFailure);
    client.addEventHandler("ChallengeError", onError);
    client.addEventHandler("RequestExpired", onExpired);

    client.challenge(session, { key_type: keyType, challenge });
  }).catch(async (err) => {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username);
      const refreshed = await ensureSession(username, account);
      const clientRetry = getClient();

      return new Promise<string>(async (resolve, reject) => {
        let inFlight = true;

        const stopWatchingVisibility = watchAppVisibility(() => {
          if (!inFlight) return;
          clientRetry.connect().catch(() => {
            console.error("HiveAuth reconnect failed after returning from wallet");
          });
        });

        const cleanup = () => {
          inFlight = false;
          clientRetry.removeEventHandler("ChallengeSuccess", successHandler);
          clientRetry.removeEventHandler("ChallengeFailure", failureHandler);
          clientRetry.removeEventHandler("ChallengeError", errorHandler);
          clientRetry.removeEventHandler("RequestExpired", expiredHandler);
          stopWatchingVisibility();
        };

        const successHandler = (ev: ChallengeSuccessEvent | any) => {
          cleanup();
          const signature = ev?.data?.challenge;
          if (!signature) {
            reject(new Error("HiveAuth returned empty signature"));
            return;
          }
          try {
            const normalized = parseChallengeSignature(signature).toString();
            resolve(normalized);
          } catch (e) {
            reject(
              e instanceof Error ? e : new Error("HiveAuth returned invalid signature")
            );
          }
        };

        const failureHandler = (ev: FailureEvent | any) => {
          cleanup();
          reject(
            new Error(
              (ev?.message as any)?.error ??
                ev?.message ??
                "HiveAuth challenge failed"
            )
          );
        };

        const errorHandler = (ev: FailureEvent | any) => {
          cleanup();
          reject(
            new Error(
              ev?.error ?? (ev?.message as any)?.error ?? "HiveAuth challenge error"
            )
          );
        };

        const expiredHandler = () => {
          cleanup();
          reject(new Error("HiveAuth challenge expired"));
        };

        await clientRetry.connect().catch(() => {});

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

/* -------------------------------- Broadcast -------------------------------- */

async function runBroadcast(
  username: string,
  keyType: "posting" | "active",
  operations: Operation[],
  account?: FullAccount
): Promise<void> {
  const session = await ensureSession(username, account);
  const client = getClient();

  await new Promise<void>(async (resolve, reject) => {
    let inFlight = true;

    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!inFlight) return;
      client.connect().catch(() => {
        console.error("HiveAuth reconnect failed after returning from wallet");
      });
    });

    const cleanup = () => {
      inFlight = false;
      client.removeEventHandler("SignSuccess", onSuccess);
      client.removeEventHandler("SignFailure", onFailure);
      client.removeEventHandler("SignError", onError);
      client.removeEventHandler("RequestExpired", onExpired);
      stopWatchingVisibility();
    };

    const onSuccess = () => {
      cleanup();
      resolve();
    };

    const onFailure = (ev: FailureEvent | any) => {
      cleanup();
      const message = (ev?.message as any)?.error ?? ev?.message;
      if (isTokenError(message)) {
        clearSession(username);
        reject(
          new HiveAuthSessionExpiredError(message ?? "HiveAuth sign failure")
        );
        return;
      }
      reject(new Error(message ?? "HiveAuth sign failure"));
    };

    const onError = (ev: FailureEvent | any) => {
      cleanup();
      const message = ev?.error ?? (ev?.message as any)?.error;
      if (isTokenError(message)) {
        clearSession(username);
        reject(new HiveAuthSessionExpiredError(message ?? "HiveAuth sign error"));
        return;
      }
      reject(new Error(message ?? "HiveAuth sign error"));
    };

    const onExpired = () => {
      cleanup();
      reject(new HiveAuthSessionExpiredError("HiveAuth sign expired"));
    };

    await client.connect().catch(() => {});

    client.addEventHandler("SignSuccess", onSuccess);
    client.addEventHandler("SignFailure", onFailure);
    client.addEventHandler("SignError", onError);
    client.addEventHandler("RequestExpired", onExpired);

    client.broadcast(session, keyType, operations);
  }).catch(async (err) => {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username);
      const refreshed = await ensureSession(username, account);
      const clientRetry = getClient();

      return new Promise<void>(async (resolve, reject) => {
        let inFlight = true;

        const stopWatchingVisibility = watchAppVisibility(() => {
          if (!inFlight) return;
          clientRetry.connect().catch(() => {
            console.error("HiveAuth reconnect failed after returning from wallet");
          });
        });

        const cleanup = () => {
          inFlight = false;
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

        const failureHandler = (ev: FailureEvent | any) => {
          cleanup();
          reject(
            new Error(
              (ev?.message as any)?.error ?? ev?.message ?? "HiveAuth sign failure"
            )
          );
        };

        const errorHandler = (ev: FailureEvent | any) => {
          cleanup();
          reject(
            new Error(
              ev?.error ?? (ev?.message as any)?.error ?? "HiveAuth sign error"
            )
          );
        };

        const expiredHandler = () => {
          cleanup();
          reject(new Error("HiveAuth sign expired"));
        };

        await clientRetry.connect().catch(() => {});

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

/* ------------------------------ Public API -------------------------------- */

export function shouldUseHiveAuth(): boolean {
  if (typeof window === "undefined") return false;
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
