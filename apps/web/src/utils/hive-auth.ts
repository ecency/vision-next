"use client";

import { Buffer } from "buffer";
import { HasClient } from "hive-auth-client";
import CryptoJS from "crypto-js";
import defaults from "@/defaults";
import {
  error as showFeedbackError,
  info as showFeedbackInfo
} from "@/features/shared/feedback";
import { get, remove, set } from "@/utils/local-storage";
import { b64uEnc } from "@/utils/b64";
import { isKeychainInAppBrowser } from "@/utils/keychain";
import { getLoginType } from "./user-token";
import i18next from "i18next";
import {
  DEFAULT_ADDRESS_PREFIX,
  Operation,
  PublicKey,
  Signature,
  TransactionConfirmation,
  cryptoUtils
} from "@hiveio/dhive";
import type { FullAccount } from "@/entities";

const HIVE_AUTH_HOST = "hive-auth.arcange.eu";
const STORAGE_KEY_PREFIX = "hiveauth-session";
const LEGACY_STORAGE_KEY_PREFIX = STORAGE_KEY_PREFIX;
const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

type HiveAuthKeyType = "posting" | "active";

/* ----------------------------- Event typings ------------------------------ */

interface AuthPendingEvent {
  uuid: string;
  key: string;
  account?: string;
  expire?: number;
}

interface AuthSuccessEvent {
  uuid?: string;
  authData?: {
    token?: string;
    key?: string;
    expire?: number; // unix timestamp (s) or ms per docs; we keep current logic
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
  accessToken?: string;
}
interface HiveAuthSessionResponse extends HiveAuthSession {}

class HiveAuthSessionExpiredError extends Error {}

export interface HiveAuthChallengeResult {
  signature: string;
  signedToken?: string;
}

/* --------------------------------- Client --------------------------------- */

let hiveAuthClient: HasClient | null = null;
// Keep the current HAS request UUID to sanity-check the ACK
let currentRequestUuid: string | null = null;

// Single-flight guards (visibility reconnects, deep-link)
let connecting = false;
let lastDeepLinkSentForUuid: string | null = null;
let lastUuidAnnounced: string | null = null;

let hasPatchedHiveAuthBroadcast = false;
let lastNonceTimestamp = 0;
let nonceIncrement = 0;

type InternalHasClient = HasClient & {
  __ecencyLastSignReqData?: HiveAuthSignRequestPayload;
  authKey: string;
  websocket?: WebSocket;
};

let hasPatchedHiveAuthSend = false;

interface HiveAuthSignRequestPayload {
  key_type: string;
  ops: Operation[];
  broadcast: boolean;
  nonce?: string;
}

// Ensure we don't spam .connect() on flaky focus/visibility events
async function safeConnect(client: HasClient) {
  if (connecting) return;
  connecting = true;
  try {
    await client.connect();
  } finally {
    connecting = false;
  }
}

function asError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error("Unknown error");
}

function isInvalidStateError(err: unknown): boolean {
  if (!err) return false;
  if (typeof DOMException !== "undefined" && err instanceof DOMException) {
    return err.name === "InvalidStateError";
  }
  if (err instanceof Error) {
    return err.name === "InvalidStateError" || err.message.includes("InvalidStateError");
  }
  return false;
}

function resetClientConnection() {
  if (!hiveAuthClient) return;

  try {
    const rawWs = (hiveAuthClient as unknown as { websocket?: WebSocket }).websocket;
    const openState = typeof WebSocket !== "undefined" ? WebSocket.OPEN : 1;
    if (rawWs && rawWs.readyState === openState && typeof rawWs.close === "function") {
      rawWs.close();
    }
  } catch (err) {
    console.warn("Failed to close HiveAuth websocket", err);
  }

  hiveAuthClient = null;
}

const HIVE_AUTH_ERROR_FIELDS = [
  "error",
  "message",
  "reason",
  "details",
  "detail",
  "description"
] as const;

function resolveHiveAuthMessage(rawMessage: unknown, fallback: string): string {
  const resolved = extractHiveAuthErrorMessage(rawMessage, new Set(), 0);
  if (resolved) return resolved;
  return fallback;
}

function extractHiveAuthErrorMessage(
  rawMessage: unknown,
  seen: Set<unknown>,
  depth: number
): string | null {
  if (depth > 5) return null;

  if (typeof rawMessage === "string") {
    const trimmed = rawMessage.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof rawMessage === "number" && Number.isFinite(rawMessage)) {
    return String(rawMessage);
  }

  if (!rawMessage) return null;

  if (Array.isArray(rawMessage)) {
    for (const entry of rawMessage) {
      const result = extractHiveAuthErrorMessage(entry, seen, depth + 1);
      if (result) return result;
    }
    return null;
  }

  if (typeof rawMessage !== "object") return null;

  if (seen.has(rawMessage)) return null;
  seen.add(rawMessage);

  for (const field of HIVE_AUTH_ERROR_FIELDS) {
    if (field in (rawMessage as Record<string, unknown>)) {
      const value = (rawMessage as Record<string, unknown>)[field];
      const result = extractHiveAuthErrorMessage(value, seen, depth + 1);
      if (result) return result;
    }
  }

  if ("code" in (rawMessage as Record<string, unknown>)) {
    const codeValue = (rawMessage as Record<string, unknown>).code;
    if (typeof codeValue === "string" && codeValue.trim()) {
      return codeValue.trim();
    }
  }

  const stringified = (() => {
    try {
      return JSON.stringify(rawMessage);
    } catch (err) {
      return null;
    }
  })();

  if (stringified && stringified !== "{}" && stringified !== "[]") {
    return stringified;
  }

  return null;
}

function showHiveAuthErrorToast(message: string) {
  if (typeof window === "undefined") return;
  const trimmed = message.trim();
  if (!trimmed) return;

  try {
    showFeedbackError(trimmed);
  } catch (err) {
    console.warn("Failed to display HiveAuth error toast", err);
  }
}

function generateHiveAuthNonce(): string {
  const now = Date.now();
  if (now === lastNonceTimestamp) {
    nonceIncrement += 1;
  } else {
    lastNonceTimestamp = now;
    nonceIncrement = 0;
  }
  return `${now}-${nonceIncrement}`;
}

function patchHiveAuthBroadcast() {
  if (hasPatchedHiveAuthBroadcast) return;

  const prototype = HasClient.prototype as any;

  if (!prototype || typeof prototype.broadcast !== "function") {
    return;
  }

  const originalAssert: ((object: any, objectName: string, props: any[]) => void) | undefined =
    typeof prototype.assert === "function" ? prototype.assert : undefined;

  if (typeof originalAssert !== "function") {
    return;
  }

  prototype.broadcast = function broadcast(
    this: InternalHasClient & {
      send: (message: string) => Promise<void> | void;
      timeout: number;
      currentRequestExpire: number;
      setExpireTimeout: () => void;
    },
    authData: { username: string; token: string; expire: number; key: string },
    keyType: string,
    ops: Operation[]
  ) {
    originalAssert.call(this, authData, "authData", [
      ["username", "string"],
      ["token", "string"],
      ["key", "string"]
    ]);
    originalAssert.call(this, ops, "ops", []);

    this.authKey = authData.key;

    const signRequest: HiveAuthSignRequestPayload = {
      key_type: keyType,
      ops,
      broadcast: true,
      nonce: generateHiveAuthNonce()
    };

    const serializedSignRequest = JSON.stringify(signRequest);
    const encryptedSignRequest = CryptoJS.AES.encrypt(
      serializedSignRequest,
      authData.key
    ).toString();

    const payload = {
      cmd: "sign_req",
      account: authData.username,
      token: authData.token,
      data: encryptedSignRequest
    };

    this.send(JSON.stringify(payload));
    this.currentRequestExpire = new Date().getTime() + this.timeout;
    this.setExpireTimeout();
    this.__ecencyLastSignReqData = signRequest;
  } as unknown as typeof HasClient.prototype.broadcast;

  hasPatchedHiveAuthBroadcast = true;
}

function patchHiveAuthSend() {
  if (hasPatchedHiveAuthSend) return;

  const prototype = HasClient.prototype as any;

  if (!prototype || typeof prototype.send !== "function") {
    return;
  }

  const originalConnect: (() => Promise<unknown>) | undefined =
    typeof prototype.connect === "function" ? prototype.connect : undefined;

  const openState = typeof WebSocket !== "undefined" ? WebSocket.OPEN : 1;
  const connectingState = typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : 0;

  const ensureSocket = async (client: InternalHasClient) => {
    if (client.websocket && typeof client.websocket.send === "function") {
      const state = client.websocket.readyState;
      if (state === openState || state === connectingState) {
        return client.websocket;
      }
    }

    client.websocket = undefined;
    client.isConnected = false as unknown as boolean;

    if (originalConnect) {
      await originalConnect.call(client);
    }

    return client.websocket && typeof client.websocket.send === "function"
      ? client.websocket
      : undefined;
  };

  prototype.send = async function patchedSend(this: InternalHasClient, message: string) {
    const socket = await ensureSocket(this);

    if (!socket) {
      throw new Error("HiveAuth websocket is unavailable");
    }

    this.log(`[SEND] ${message}`);

    try {
      socket.send(message);
    } catch (err) {
      this.websocket = undefined;
      this.isConnected = false as unknown as boolean;

      const retrySocket = await ensureSocket(this);

      if (!retrySocket) {
        throw err;
      }

      retrySocket.send(message);
    }
  } as typeof HasClient.prototype.send;

  hasPatchedHiveAuthSend = true;
}

function getLastSignRequestPayload(client: HasClient): HiveAuthSignRequestPayload | undefined {
  return (client as InternalHasClient).__ecencyLastSignReqData;
}

function announcePendingUuid(uuid: string) {
  if (typeof window === "undefined") return;
  if (!uuid) return;
  if (lastUuidAnnounced === uuid) return;

  const shortUuid = uuid.slice(0, 8).toUpperCase();

  try {
    const message = i18next.t("hive-auth.pending-request", {
      defaultValue: "HiveAuth request pending. Match ID {{id}} in your wallet.",
      id: shortUuid
    });
    showFeedbackInfo(message);
    lastUuidAnnounced = uuid;
  } catch (err) {
    console.warn("Failed to display HiveAuth pending request notice", err);
  }
}

function getClient(): HasClient {
  if (typeof window === "undefined") {
    throw new Error("HiveAuth client is only available in the browser");
  }
  patchHiveAuthSend();
  patchHiveAuthBroadcast();
  if (hiveAuthClient) {
    try {
      const rawWs = (hiveAuthClient as unknown as { websocket?: WebSocket }).websocket;
      if (rawWs) {
        const closingState = typeof WebSocket !== "undefined" ? WebSocket.CLOSING : 2;
        const closedState = typeof WebSocket !== "undefined" ? WebSocket.CLOSED : 3;
        if (rawWs.readyState === closingState || rawWs.readyState === closedState) {
          resetClientConnection();
        }
      }
    } catch (err) {
      console.warn("Failed to inspect HiveAuth websocket", err);
      resetClientConnection();
    }
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

function storageKey(username: string, keyType: HiveAuthKeyType) {
  return `${STORAGE_KEY_PREFIX}-${username}-${keyType}`;
}

function legacyStorageKey(username: string) {
  return `${LEGACY_STORAGE_KEY_PREFIX}-${username}`;
}

function loadSession(username: string, keyType: HiveAuthKeyType): HiveAuthSession | null {
  const stored = get(storageKey(username, keyType));

  const payload = stored ?? (keyType === "posting" ? get(legacyStorageKey(username)) : null);
  if (!payload) return null;

  const expire = normalizeExpire(payload.expire);
  const session: HiveAuthSession = {
    username: payload.username,
    token: payload.token,
    key: payload.key,
    expire,
    accessToken: payload.accessToken
  };

  if (!stored && keyType === "posting") {
    try {
      set(storageKey(username, keyType), session);
      remove(legacyStorageKey(username));
    } catch (err) {
      console.warn("Failed to migrate legacy HiveAuth session", err);
    }
  }

  return session;
}

function saveSession(session: HiveAuthSession, keyType: HiveAuthKeyType) {
  set(storageKey(session.username, keyType), session);
  if (keyType === "posting") {
    remove(legacyStorageKey(session.username));
  }
}

function clearSession(username: string, keyType?: HiveAuthKeyType) {
  if (!keyType) {
    remove(legacyStorageKey(username));
    remove(storageKey(username, "posting"));
    remove(storageKey(username, "active"));
    return;
  }

  remove(storageKey(username, keyType));
  if (keyType === "posting") {
    remove(legacyStorageKey(username));
  }
}

/** Keep the original expectation from docs: accept seconds or ms as timestamps; no TTL conversion */
function normalizeExpire(expire: number): number {
  if (!expire) return 0;
  // If seconds (10-digit), convert to ms; if already ms-ish, keep as is
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

type HasRequestType = "auth" | "challenge" | "sign";

function sanitizeDeepLinkPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  );
}

function composeSignedChallengeToken(
  challenge: string,
  signature: string
): string | null {
  if (!challenge || !signature) return null;

  try {
    const parsed = JSON.parse(challenge);
    if (!parsed || typeof parsed !== "object") return null;

    const container = parsed as Record<string, unknown> & { signatures?: string[] };
    container.signatures = [signature];

    return b64uEnc(JSON.stringify(container));
  } catch (err) {
    console.warn("Failed to compose signed HiveAuth challenge token", err);
    return null;
  }
}

function dispatchPendingDeepLink(
  type: HasRequestType,
  username: string,
  uuid: string | undefined,
  expire: number | undefined,
  extras: Record<string, unknown>
) {
  if (!uuid) return;

  currentRequestUuid = uuid;

  const expireMs = normalizeExpire(expire ?? 0);
  const expired = !!expireMs && expireMs <= Date.now();

  if (expired) {
    const message =
      type === "auth"
        ? "HiveAuth request expired before opening wallet"
        : "HiveAuth challenge expired before opening wallet";
    showHiveAuthErrorToast(message);
    return;
  }

  const requiresKey = type === "auth" || type === "challenge" || type === "sign";
  if (requiresKey && !extras.key) {
    return;
  }

  announcePendingUuid(uuid);

  if (!isMobileBrowser()) return;
  if (lastDeepLinkSentForUuid === uuid) return;

  const payload = sanitizeDeepLinkPayload({
    account: username,
    uuid,
    host: `wss://${HIVE_AUTH_HOST}`,
    hostname: HIVE_AUTH_HOST,
    ...extras
  });

  try {
    const encoded = btoa(JSON.stringify(payload));
    lastDeepLinkSentForUuid = uuid;
    openDeepLink(`has://${type}_req/${encoded}`);
  } catch (err) {
    console.error("Failed to serialize HiveAuth deep link payload", err);
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

function toDhiveBuffer(bytes: Uint8Array): Buffer {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function parseChallengeSignature(rawSignature: unknown): Signature {
  if (!rawSignature) {
    throw new Error("HiveAuth challenge response is missing signature");
  }

  if (typeof rawSignature === "object" && rawSignature !== null) {
    const sig = (rawSignature as any).sig || (rawSignature as any).signature;
    if (!sig || typeof sig !== "string") {
      throw new Error("HiveAuth challenge object missing sig field");
    }
    return parseChallengeSignature(sig);
  }

  if (typeof rawSignature !== "string") {
    throw new Error("HiveAuth challenge signature is not a string");
  }

  const s = rawSignature.trim();

  if (s.startsWith("SIG_")) return Signature.fromString(s);
  if (/^[0-9a-fA-F]+$/.test(s)) return Signature.fromBuffer(toDhiveBuffer(hexToBytes(s)));

  try {
    return Signature.fromBuffer(toDhiveBuffer(b64ToBytes(s)));
  } catch (err) {
    console.error("HiveAuth challenge signature parsing failed", err);
  }

  throw new Error("HiveAuth challenge signature has an unsupported format");
}

function verifyChallengeSignature(
  challenge: string,
  response:
    | { challenge?: string | { sig?: string; signature?: string; pubkey?: string }; pubkey?: string }
    | undefined,
  account?: FullAccount
) {
  if (!response) throw new Error("HiveAuth challenge response is missing payload");

  const rawSignature = response.challenge;

  // Modern wallets may omit challenge signature entirely.
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
      (response as any).pubkey ??
      (typeof rawSignature === "object" && rawSignature
        ? (rawSignature as any).pubkey
        : undefined);

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

    for (const key of authorizedKeys) {
      try {
        const publicKey = PublicKey.fromString(key);
        if (signature.verifyHash(digest, publicKey)) return true;
      } catch (err) {
        console.error("HiveAuth challenge verification failed for account key", err);
      }
    }

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
  account: FullAccount | undefined,
  keyType: HiveAuthKeyType,
  allowClientReset = true
): Promise<HiveAuthSessionResponse> {
  const client = getClient();

  return new Promise(async (resolve, reject) => {
    const challenge = JSON.stringify({ login: username, ts: Date.now() });
    const challengeEnabled = !!challenge;

    let inFlight = true;
    currentRequestUuid = null;
    lastDeepLinkSentForUuid = null;
    lastUuidAnnounced = null;

    // Reconnect when the user returns from the wallet (single-flight)
    const stopWatchingVisibility = watchAppVisibility(() => {
      if (!inFlight) return;
      safeConnect(client).catch(() => {
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
      // ensure state is cleared between attempts
      currentRequestUuid = null;
      lastDeepLinkSentForUuid = null;
      lastUuidAnnounced = null;
    };

    const onPending = (ev: AuthPendingEvent | any) => {
      const e: AuthPendingEvent = ev ?? ({} as any);
      const accountName = e?.account ?? username;
      const pendingUuid = e?.uuid;
      const expire = (ev as any)?.expire ?? 0;

      dispatchPendingDeepLink("auth", accountName, pendingUuid, expire, {
        key: e?.key,
        key_type: keyType
      });
    };

    const onSuccess = (ev: AuthSuccessEvent | any) => {
      cleanup();
      const { authData, data, uuid: ackUuid } = ev ?? {};

      if (!authData?.token || !authData?.key) {
        const message = "HiveAuth returned incomplete session";
        showHiveAuthErrorToast(message);
        reject(new Error(message));
        return;
      }

      if (currentRequestUuid && ackUuid && ackUuid !== currentRequestUuid) {
        const message = "HiveAuth uuid mismatch";
        showHiveAuthErrorToast(message);
        reject(new Error(message));
        return;
      }

      const expireMs = normalizeExpire(authData.expire ?? 0);
      if (!expireMs || expireMs <= Date.now()) {
        const message = "HiveAuth session already expired";
        showHiveAuthErrorToast(message);
        reject(new Error(message));
        return;
      }

      try {
        if (data?.challenge && challengeEnabled) {
          verifyChallengeSignature(challenge, data, account);
        }
      } catch (err) {
        console.warn("Signature verification failed; proceeding (HAS already verified).", err);
      }

      const session: HiveAuthSession = {
        username,
        token: authData.token!,
        key: authData.key!,
        expire: expireMs
      };
      saveSession(session, keyType);
      resolve(session);
    };

    const onFailure = (ev: FailureEvent | any) => {
      cleanup();
      const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
      const message = rawMessage ?? "HiveAuth authentication failed";
      showHiveAuthErrorToast(message);
      reject(new Error(message));
    };

    const onError = (ev: FailureEvent | any) => {
      cleanup();
      const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
      const message = rawMessage ?? "HiveAuth error";
      showHiveAuthErrorToast(message);
      reject(new Error(message));
    };

    const onExpired = () => {
      cleanup();
      const message = "HiveAuth authentication expired";
      showHiveAuthErrorToast(message);
      reject(new HiveAuthSessionExpiredError(message));
    };

    // Proactive connect to avoid missing early events on flaky networks
    try {
      await safeConnect(client);
    } catch (err) {
      cleanup();
      reject(asError(err));
      return;
    }

    client.addEventHandler("AuthPending", onPending);
    client.addEventHandler("AuthSuccess", onSuccess);
    client.addEventHandler("AuthFailure", onFailure);
    client.addEventHandler("Error", onError);
    client.addEventHandler("RequestExpired", onExpired);

    try {
      client.authenticate(
        { username },
        buildAppMeta(),
        { key_type: keyType, challenge } // keep challenge inline per your preference
      );
    } catch (err) {
      cleanup();
      reject(asError(err));
    }
  }).catch(async (err) => {
    if (allowClientReset && isInvalidStateError(err)) {
      resetClientConnection();
      return requestAuthentication(username, account, keyType, false);
    }
    throw err;
  });
}

async function ensureSession(
  username: string,
  keyType: HiveAuthKeyType,
  account?: FullAccount
): Promise<HiveAuthSession> {
  const cached = loadSession(username, keyType);
  if (cached && cached.expire && cached.expire > Date.now()) {
    return cached;
  }
  try {
    return await requestAuthentication(username, account, keyType);
  } catch (err) {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username, keyType);
    }
    throw err;
  }
}

/* ------------------------------- Challenge -------------------------------- */

async function executeChallenge(
  username: string,
  session: HiveAuthSession,
  keyType: HiveAuthKeyType,
  challenge: string,
  allowClientReset: boolean
): Promise<HiveAuthChallengeResult> {
  const client = getClient();

  try {
    return await new Promise<HiveAuthChallengeResult>(async (resolve, reject) => {
      let inFlight = true;
      currentRequestUuid = null; // keep consistent; challenge doesn’t use it but reset anyway
      lastUuidAnnounced = null;

      const stopWatchingVisibility = watchAppVisibility(() => {
        if (!inFlight) return;
        safeConnect(client).catch(() => {
          console.error("HiveAuth reconnect failed after returning from wallet");
        });
      });

      const cleanup = () => {
        inFlight = false;
        client.removeEventHandler("ChallengePending", onPending);
        client.removeEventHandler("ChallengeSuccess", onSuccess);
        client.removeEventHandler("ChallengeFailure", onFailure);
        client.removeEventHandler("ChallengeError", onError);
        client.removeEventHandler("Error", onError);
        client.removeEventHandler("RequestExpired", onExpired);
        stopWatchingVisibility();
        currentRequestUuid = null;
        lastDeepLinkSentForUuid = null;
        lastUuidAnnounced = null;
      };

      const onPending = (ev: ChallengeSuccessEvent | any) => {
        const payload = (ev as any)?.message ?? ev ?? {};
        const pendingUuid = payload?.uuid ?? (ev as any)?.uuid;
        const expire = payload?.expire ?? (ev as any)?.expire ?? 0;

        dispatchPendingDeepLink("challenge", username, pendingUuid, expire, {
          key: session.key,
          key_type: keyType,
          challenge
        });
      };

      const onSuccess = (ev: ChallengeSuccessEvent | any) => {
        cleanup();
        const signature = ev?.data?.challenge;
        if (!signature) {
          const message = "HiveAuth returned empty signature";
          showHiveAuthErrorToast(message);
          reject(new Error(message));
          return;
        }
        const ackUuid = ev?.uuid ?? (ev as any)?.message?.uuid;
        if (currentRequestUuid && ackUuid && ackUuid !== currentRequestUuid) {
          const message = "HiveAuth uuid mismatch";
          showHiveAuthErrorToast(message);
          reject(new Error(message));
          return;
        }
        try {
          const normalized = parseChallengeSignature(signature).toString();
          const signedToken = composeSignedChallengeToken(challenge, normalized);

          if (signedToken) {
            session.accessToken = signedToken;
            saveSession(session, keyType);
          }

          resolve({
            signature: normalized,
            signedToken: signedToken ?? undefined
          });
        } catch (err) {
          const fallback = "HiveAuth returned invalid signature";
          const message = resolveHiveAuthMessage(
            err instanceof Error ? err.message : undefined,
            fallback
          );
          showHiveAuthErrorToast(message);
          reject(err instanceof Error ? err : new Error(fallback));
        }
      };

      const onFailure = (ev: FailureEvent | any) => {
        cleanup();
        const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
        const resolvedMessage = rawMessage ?? "HiveAuth challenge failed";
        if (rawMessage && isTokenError(rawMessage)) {
          clearSession(username, keyType);
          showHiveAuthErrorToast(resolvedMessage);
          reject(new HiveAuthSessionExpiredError(resolvedMessage));
          return;
        }
        showHiveAuthErrorToast(resolvedMessage);
        reject(new Error(resolvedMessage));
      };

      const onError = (ev: FailureEvent | any) => {
        cleanup();
        const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
        const resolvedMessage = rawMessage ?? "HiveAuth challenge error";
        if (rawMessage && isTokenError(rawMessage)) {
          clearSession(username, keyType);
          showHiveAuthErrorToast(resolvedMessage);
          reject(new HiveAuthSessionExpiredError(resolvedMessage));
          return;
        }
        showHiveAuthErrorToast(resolvedMessage);
        reject(new Error(resolvedMessage));
      };

      const onExpired = () => {
        cleanup();
        const message = "HiveAuth challenge expired";
        showHiveAuthErrorToast(message);
        reject(new HiveAuthSessionExpiredError(message));
      };

      try {
        await safeConnect(client);
      } catch (err) {
        cleanup();
        reject(asError(err));
        return;
      }

      client.addEventHandler("ChallengePending", onPending);
      client.addEventHandler("ChallengeSuccess", onSuccess);
      client.addEventHandler("ChallengeFailure", onFailure);
      client.addEventHandler("ChallengeError", onError);
      client.addEventHandler("Error", onError);
      client.addEventHandler("RequestExpired", onExpired);

      try {
        const { username: accountName, token, key, expire } = session;
        client.challenge(
          { username: accountName, token, key, expire },
          { key_type: keyType, challenge }
        );
      } catch (err) {
        cleanup();
        reject(asError(err));
      }
    });
  } catch (err) {
    if (allowClientReset && isInvalidStateError(err)) {
      resetClientConnection();
      return executeChallenge(username, session, keyType, challenge, false);
    }
    throw err;
  }
}

async function runChallenge(
  username: string,
  challenge: string,
  keyType: HiveAuthKeyType,
  account?: FullAccount
): Promise<HiveAuthChallengeResult> {
  const session = await ensureSession(username, keyType, account);

  try {
    return await executeChallenge(username, session, keyType, challenge, true);
  } catch (err) {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username, keyType);
      const refreshed = await ensureSession(username, keyType, account);
      return executeChallenge(username, refreshed, keyType, challenge, true);
    }
    throw err;
  }
}

/* -------------------------------- Broadcast -------------------------------- */

function extractTransactionConfirmation(ev: any): TransactionConfirmation {
  const payload = ev?.message ?? ev ?? {};
  const result = (payload?.result ?? payload?.response ?? payload) as TransactionConfirmation;

  if (result && typeof result === "object") {
    return result;
  }

  return {} as TransactionConfirmation;
}

function inferSignRequestKeyType(
  operations: Operation[],
  fallback: HiveAuthKeyType
): HiveAuthKeyType {
  if (!operations || operations.length === 0) {
    return fallback;
  }

  let requiresPosting = false;

  for (const [opName, opPayload] of operations) {
    if (opName === "custom_json") {
      const payload = opPayload as {
        required_posting_auths?: string[];
        required_auths?: string[];
      };

      if (Array.isArray(payload?.required_auths) && payload.required_auths.length > 0) {
        return "active";
      }

      if (
        Array.isArray(payload?.required_posting_auths) &&
        payload.required_posting_auths.length > 0
      ) {
        requiresPosting = true;
        continue;
      }

      continue;
    }

    switch (opName) {
      case "vote":
      case "comment":
      case "comment_options":
      case "delete_comment":
      case "claim_reward_balance":
        requiresPosting = true;
        continue;
      default:
        return "active";
    }
  }

  if (requiresPosting) {
    return "posting";
  }

  return fallback;
}

async function executeBroadcast(
  username: string,
  session: HiveAuthSession,
  keyType: HiveAuthKeyType,
  operations: Operation[],
  allowClientReset: boolean
): Promise<TransactionConfirmation> {
  const client = getClient();

  const requestKeyType = inferSignRequestKeyType(operations, keyType);

  try {
    return await new Promise<TransactionConfirmation>(async (resolve, reject) => {
      let inFlight = true;
      currentRequestUuid = null;
      lastUuidAnnounced = null;

      const stopWatchingVisibility = watchAppVisibility(() => {
        if (!inFlight) return;
        safeConnect(client).catch(() => {
          console.error("HiveAuth reconnect failed after returning from wallet");
        });
      });

      const cleanup = () => {
        inFlight = false;
        client.removeEventHandler("SignPending", onPending);
        client.removeEventHandler("SignSuccess", onSuccess);
        client.removeEventHandler("SignFailure", onFailure);
        client.removeEventHandler("SignError", onError);
        client.removeEventHandler("Error", onError);
        client.removeEventHandler("RequestExpired", onExpired);
        stopWatchingVisibility();
        currentRequestUuid = null;
        lastDeepLinkSentForUuid = null;
        lastUuidAnnounced = null;
      };

      const onSuccess = (ev: any) => {
        const ackUuid = ev?.message?.uuid ?? ev?.uuid;
        if (currentRequestUuid && ackUuid && ackUuid !== currentRequestUuid) {
          cleanup();
          const message = "HiveAuth uuid mismatch";
          showHiveAuthErrorToast(message);
          reject(new Error(message));
          return;
        }
        cleanup();
        resolve(extractTransactionConfirmation(ev));
      };

      const onPending = (ev: any) => {
        const payload = ev?.message ?? ev ?? {};
        const pendingUuid = payload?.uuid ?? ev?.uuid;
        const expire = payload?.expire ?? ev?.expire ?? 0;

        const lastSignRequestPayload = getLastSignRequestPayload(client);

        const defaultSignRequest =
          lastSignRequestPayload ?? {
            key_type: requestKeyType,
            ops: operations,
            broadcast: true
          };

        const extras: Record<string, unknown> = {
          key: session.key,
          key_type: requestKeyType
        };

        let signReq: unknown = payload?.sign_req;
        if (!signReq) {
          signReq = defaultSignRequest;
        }

        if (signReq) {
          extras.sign_req = signReq;
        }

        let signReqData: unknown = payload?.sign_req_data;
        if (!signReqData) {
          try {
            signReqData = b64uEnc(JSON.stringify(defaultSignRequest));
          } catch (err) {
            console.error("Failed to encode HiveAuth sign request payload", err);
          }
        }

        if (signReqData) {
          extras.sign_req_data = signReqData;
        }

        dispatchPendingDeepLink("sign", username, pendingUuid, expire, extras);
      };

      const onFailure = (ev: FailureEvent | any) => {
        cleanup();
        const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
        const resolvedMessage = rawMessage ?? "HiveAuth sign failure";
        if (rawMessage && isTokenError(rawMessage)) {
          clearSession(username, requestKeyType);
          showHiveAuthErrorToast(resolvedMessage);
          reject(new HiveAuthSessionExpiredError(resolvedMessage));
          return;
        }
        showHiveAuthErrorToast(resolvedMessage);
        reject(new Error(resolvedMessage));
      };

      const onError = (ev: FailureEvent | any) => {
        cleanup();
        const rawMessage = extractHiveAuthErrorMessage(ev, new Set(), 0);
        const resolvedMessage = rawMessage ?? "HiveAuth sign error";
        if (rawMessage && isTokenError(rawMessage)) {
          clearSession(username, requestKeyType);
          showHiveAuthErrorToast(resolvedMessage);
          reject(new HiveAuthSessionExpiredError(resolvedMessage));
          return;
        }
        showHiveAuthErrorToast(resolvedMessage);
        reject(new Error(resolvedMessage));
      };

      const onExpired = () => {
        cleanup();
        const message = "HiveAuth sign expired";
        showHiveAuthErrorToast(message);
        reject(new HiveAuthSessionExpiredError(message));
      };

      try {
        await safeConnect(client);
      } catch (err) {
        cleanup();
        reject(asError(err));
        return;
      }

      client.addEventHandler("SignPending", onPending);
      client.addEventHandler("SignSuccess", onSuccess);
      client.addEventHandler("SignFailure", onFailure);
      client.addEventHandler("SignError", onError);
      client.addEventHandler("Error", onError);
      client.addEventHandler("RequestExpired", onExpired);

      try {
        const { username: accountName, token, key, expire } = session;
        client.broadcast({ username: accountName, token, key, expire }, requestKeyType, operations);
      } catch (err) {
        cleanup();
        reject(asError(err));
      }
    });
  } catch (err) {
    if (allowClientReset && isInvalidStateError(err)) {
      resetClientConnection();
      return executeBroadcast(username, session, keyType, operations, false);
    }
    throw err;
  }
}

async function runBroadcast(
  username: string,
  keyType: HiveAuthKeyType,
  operations: Operation[],
  account?: FullAccount
): Promise<TransactionConfirmation> {
  const resolvedKeyType = inferSignRequestKeyType(operations, keyType);
  const session = await ensureSession(username, resolvedKeyType, account);

  try {
    return await executeBroadcast(username, session, resolvedKeyType, operations, true);
  } catch (err) {
    if (err instanceof HiveAuthSessionExpiredError) {
      clearSession(username, resolvedKeyType);
      const refreshed = await ensureSession(username, resolvedKeyType, account);
      return await executeBroadcast(username, refreshed, resolvedKeyType, operations, true);
    }
    throw err;
  }
}

/* ------------------------------ Public API -------------------------------- */

export function shouldUseHiveAuth(username?: string): boolean {
  if (typeof window === "undefined") return false;

  if (username) {
    const loginType = getLoginType(username);
    if (loginType) {
      return loginType === "hiveauth";
    }
  }

  const hasKeychain = Boolean((window as any).hive_keychain);
  return isMobileBrowser() && !hasKeychain && !isKeychainInAppBrowser();
}

export async function signWithHiveAuth(
  username: string,
  message: string,
  account?: FullAccount,
  keyType: HiveAuthKeyType = "posting"
): Promise<HiveAuthChallengeResult> {
  return runChallenge(username, message, keyType, account);
}

export async function broadcastWithHiveAuth(
  username: string,
  operations: Operation[],
  keyType: HiveAuthKeyType = "posting",
  account?: FullAccount
): Promise<TransactionConfirmation> {
  return await runBroadcast(username, keyType, operations, account);
}

export function resetHiveAuthSession(username: string) {
  clearSession(username);
}
