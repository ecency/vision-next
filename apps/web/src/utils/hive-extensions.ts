/**
 * Unified Hive Browser Extensions abstraction.
 *
 * Supports the Hive Unified Wallet Protocol (window.hive.providers[]) and
 * falls back to legacy per-global detection for wallets that haven't adopted
 * the protocol yet:
 * - Hive Keychain (window.hive_keychain)
 * - Hive Keeper (window.hive + window.hive_extension)
 * - Peak Vault (window.peakvault)
 *
 * Provides a single detection + broadcast/sign API so the rest of the app
 * doesn't need to know which extension the user has installed.
 */

import { AuthorityTypes, KeyChainImpl, TxResponse } from "@/types";
import type { PeakVaultApi } from "@/types/app-window";
import { extensionErrorMessage, isUserCancellation, isRetryableNodeError } from "./extension-error";
import publicNodes from "../../public/public-nodes.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HiveExtensionId = "keychain" | "hive-keeper" | "peakvault";

export interface DetectedExtension {
  id: HiveExtensionId;
  name: string;
  icon: string;
}

interface HiveWalletProvider {
  name: string;
  rdns: string;
  provider: any;
}

/** Maps provider rdns to our extension IDs */
const RDNS_MAP: Record<string, { id: HiveExtensionId; name: string; icon: string }> = {
  "com.ecency.keeper": { id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" },
  "com.hivekeychain": { id: "keychain", name: "Keychain", icon: "/assets/keychain.png" },
  "com.peakd.vault": { id: "peakvault", name: "Peak Vault", icon: "/assets/peakvault.svg" },
};

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Returns a list of all currently detected Hive browser extensions.
 * Prefers the Hive Unified Wallet Protocol (window.hive.providers[]) when
 * available, falls back to legacy per-global detection.
 */
export function getDetectedExtensions(): DetectedExtension[] {
  if (typeof window === "undefined") return [];

  const seen = new Set<HiveExtensionId>();
  const detected: DetectedExtension[] = [];

  const add = (ext: DetectedExtension) => {
    if (!seen.has(ext.id)) {
      seen.add(ext.id);
      detected.push(ext);
    }
  };

  // Hive Unified Wallet Protocol - providers registry
  const providers: HiveWalletProvider[] | undefined = (window as any).hive?.providers;
  if (providers?.length) {
    for (const p of providers) {
      const meta = RDNS_MAP[p.rdns];
      if (meta) add({ id: meta.id, name: meta.name, icon: meta.icon });
    }
  }

  // Legacy per-global detection (fills in wallets not yet in providers)
  if ((window as any).hive && (window as any).hive_extension) {
    add({ id: "hive-keeper", name: "Hive Keeper", icon: "/assets/keeper.svg" });
  }
  if ((window as any).hive_keychain) {
    add({ id: "keychain", name: "Keychain", icon: "/assets/keychain.png" });
  }
  if ((window as any).peakvault) {
    add({ id: "peakvault", name: "Peak Vault", icon: "/assets/peakvault.svg" });
  }

  return detected;
}

/**
 * Returns true if any Hive browser extension is available.
 */
export function hasAnyHiveExtension(): boolean {
  if (typeof window === "undefined") return false;
  const providers: HiveWalletProvider[] | undefined = (window as any).hive?.providers;
  if (providers?.some((p) => Boolean(RDNS_MAP[p.rdns]))) return true;
  return !!(
    (window as any).hive_keychain ||
    ((window as any).hive && (window as any).hive_extension) ||
    (window as any).peakvault
  );
}

/**
 * Returns the best available extension to use for signing/broadcasting.
 * Priority: Hive Keeper > Keychain > Peak Vault
 */
export function getPreferredExtension(): DetectedExtension | null {
  const detected = getDetectedExtensions();
  return detected[0] ?? null;
}

// ---------------------------------------------------------------------------
// User preference (stored in localStorage for persistence across sessions)
// ---------------------------------------------------------------------------

const PREFERRED_EXTENSION_KEY = "ecency_preferred_hive_extension";

/**
 * Set the user's preferred extension. Stored in localStorage.
 */
export function setPreferredExtensionId(id: HiveExtensionId | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(PREFERRED_EXTENSION_KEY, id);
    } else {
      localStorage.removeItem(PREFERRED_EXTENSION_KEY);
    }
  } catch {
    // Storage blocked (private browsing, quota exceeded) - non-fatal
  }
}

/**
 * Get the user's preferred extension from localStorage.
 */
export function getPreferredExtensionId(): HiveExtensionId | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFERRED_EXTENSION_KEY) as HiveExtensionId | null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Unified Sign Buffer
// ---------------------------------------------------------------------------

/**
 * Sign a message buffer using the preferred or best available extension.
 * Reads user preference from localStorage if no explicit preferredId is given.
 */
export function signBufferWithExtension(
  account: string,
  message: string,
  authType: AuthorityTypes = "Posting",
  rpc: string | null = null,
  preferredId?: HiveExtensionId
): Promise<TxResponse> {
  const extId = preferredId ?? getPreferredExtensionId();
  if (extId) {
    const resolved =
      extId === "peakvault" ? null :
      extId === "hive-keeper" ? getHiveKeeperInstance() :
      extId === "keychain" ? getKeychainInstance() : null;
    const pv = extId === "peakvault" ? getPeakVaultInstance() : null;

    if (pv) return signBufferViaPeakVault(pv, account, message, authType);
    if (resolved) return signBufferViaKeychain(resolved, account, message, authType, rpc);

    // Preferred extension no longer available - clear stale preference
    if (!preferredId) setPreferredExtensionId(null);
  }

  // Auto-detection fallback
  const keychainLike = getKeychainLikeInstance();
  if (keychainLike) {
    return signBufferViaKeychain(keychainLike, account, message, authType, rpc);
  }

  const peakvault = getPeakVaultInstance();
  if (peakvault) {
    return signBufferViaPeakVault(peakvault, account, message, authType);
  }

  return Promise.reject(
    new Error("No Hive browser extension found. Please install Hive Keeper, Keychain, or Peak Vault.")
  );
}

// ---------------------------------------------------------------------------
// Unified Broadcast
// ---------------------------------------------------------------------------

/**
 * Broadcast operations using the preferred or best available extension.
 * Reads user preference from localStorage if no explicit preferredId is given.
 */
export function broadcastWithExtension(
  account: string,
  operations: any[],
  keyType: "posting" | "active" | "owner" | "memo",
  rpc: string | null = null,
  preferredId?: HiveExtensionId
): Promise<any> {
  const extId = preferredId ?? getPreferredExtensionId();
  if (extId) {
    const resolved =
      extId === "peakvault" ? null :
      extId === "hive-keeper" ? getHiveKeeperInstance() :
      extId === "keychain" ? getKeychainInstance() : null;
    const pv = extId === "peakvault" ? getPeakVaultInstance() : null;

    if (pv) {
      if (keyType === "owner") return Promise.reject(new Error("Peak Vault does not support owner authority operations."));
      return broadcastViaPeakVault(pv, account, operations, keyType as "posting" | "active" | "memo");
    }
    if (resolved) return broadcastViaKeychain(resolved, account, operations, keyType, rpc);

    // Preferred extension no longer available - clear stale preference
    if (!preferredId) setPreferredExtensionId(null);
  }

  // Auto-detection fallback
  const keychainLike = getKeychainLikeInstance();
  if (keychainLike) {
    return broadcastViaKeychain(keychainLike, account, operations, keyType, rpc);
  }

  const peakvault = getPeakVaultInstance();
  if (peakvault) {
    if (keyType === "owner") {
      return Promise.reject(new Error("Peak Vault does not support owner authority operations."));
    }
    return broadcastViaPeakVault(peakvault, account, operations, keyType as "posting" | "active" | "memo");
  }

  return Promise.reject(
    new Error("No Hive browser extension found. Please install Hive Keeper, Keychain, or Peak Vault.")
  );
}

// ---------------------------------------------------------------------------
// Internal: Instance access
// ---------------------------------------------------------------------------

/** Resolve a provider API from the unified registry by rdns */
function getProviderByRdns(rdns: string): any | null {
  const providers: HiveWalletProvider[] | undefined = (window as any).hive?.providers;
  return providers?.find((p) => p.rdns === rdns)?.provider ?? null;
}

/**
 * Returns the Keychain-compatible extension instance.
 * Priority: Hive Keeper > Keychain (via providers registry, then legacy globals).
 */
function getKeychainLikeInstance(): KeyChainImpl | null {
  if (typeof window === "undefined") return null;
  return getHiveKeeperInstance() || getKeychainInstance();
}

function getHiveKeeperInstance(): KeyChainImpl | null {
  if (typeof window === "undefined") return null;
  return getProviderByRdns("com.ecency.keeper")
    || ((window as any).hive && (window as any).hive_extension ? (window as any).hive : null);
}

function getKeychainInstance(): KeyChainImpl | null {
  if (typeof window === "undefined") return null;
  return getProviderByRdns("com.hivekeychain")
    || ((window as any).hive_keychain ?? null);
}

function getPeakVaultInstance(): PeakVaultApi | null {
  if (typeof window === "undefined") return null;
  return getProviderByRdns("com.peakd.vault")
    || ((window as any).peakvault ?? null);
}

// ---------------------------------------------------------------------------
// Internal: Keychain-compatible sign/broadcast (callback-based)
// ---------------------------------------------------------------------------

/**
 * Fast liveness ping. Keychain-compatible extensions (Keychain, Hive Keeper) run
 * a Manifest V3 service worker that idles after ~30s; the first request to a
 * sleeping or crashed worker can silently never call back, leaving the user on a
 * 60s spinner. requestHandshake wakes the worker and confirms it is reachable, so
 * a genuinely dead worker fails fast with an actionable message instead. Resolves
 * for instances that do not expose requestHandshake (the sign request handles
 * those directly).
 */
function pingKeychain(keychain: KeyChainImpl, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof keychain.requestHandshake !== "function") {
      resolve();
      return;
    }
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      reject(new Error("Extension is not responding. Click its icon to wake it, then try again."));
    };
    const timeoutId = setTimeout(fail, timeoutMs);
    try {
      keychain.requestHandshake(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve();
      });
    } catch {
      clearTimeout(timeoutId);
      fail();
    }
  });
}

function signBufferViaKeychain(
  keychain: KeyChainImpl,
  account: string,
  message: string,
  authType: AuthorityTypes,
  rpc: string | null
): Promise<TxResponse> {
  return pingKeychain(keychain).then(
    () =>
      new Promise<TxResponse>((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Extension request timed out. Please try again."));
          }
        }, 60000);

        keychain.requestSignBuffer(
          account,
          message,
          authType,
          (resp: TxResponse) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            if (!resp.success) {
              reject(new Error(extensionErrorMessage(resp, "Operation cancelled")));
              return;
            }
            resolve(resp);
          },
          rpc
        );
      })
  );
}

/**
 * A known-good Hive RPC node to retry a failed broadcast through — the first
 * (preferred) entry of Ecency's curated public-nodes.json. Used only as a
 * one-shot fallback when the user's own Keychain node fails (see
 * broadcastViaKeychain). Returns null if the list is empty.
 */
function getKeychainFallbackRpc(): string | null {
  return (publicNodes as string[])[0] ?? null;
}

function broadcastViaKeychain(
  keychain: KeyChainImpl,
  account: string,
  operations: any[],
  keyType: string,
  rpc: string | null
): Promise<any> {
  // Map SDK key types to Keychain authority types (capitalized)
  const authorityType = (keyType.charAt(0).toUpperCase() + keyType.slice(1)) as AuthorityTypes;

  const attempt = (node: string | null): Promise<TxResponse> =>
    new Promise((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("Extension request timed out. Please try again."));
        }
      }, 60000);

      keychain.requestBroadcast(
        account,
        operations,
        authorityType,
        (response: TxResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(response);
        },
        node
      );
    });

  // Wake the (possibly idle Manifest V3) worker first so a sleeping/crashed
  // extension fails fast on votes/posts/transfers too, not just login. The
  // fallback-node retry below does not re-ping: the worker is already awake.
  return pingKeychain(keychain)
    .then(() => attempt(rpc))
    .then((response) => {
    if (response.success) {
      return response.result;
    }

    // The user's own Keychain node failed to broadcast. Retry once through a
    // known-good node so a flaky/outaged default node (e.g. the common
    // api.hive.blog default during maintenance) doesn't block the user. Gated to:
    //  - rpc == null (Keychain used the user's own node, not a caller-pinned one)
    //  - a node/transport failure (isRetryableNodeError) — NOT a user cancel and
    //    NOT a deterministic chain error (missing authority, RC, already
    //    broadcasted), which fail identically on any node and would only re-open
    //    the confirmation popup for nothing.
    const fallbackNode = rpc == null ? getKeychainFallbackRpc() : null;
    if (fallbackNode && !isUserCancellation(response) && isRetryableNodeError(response)) {
      return attempt(fallbackNode).then((retry) => {
        if (retry.success) {
          return retry.result;
        }
        // Retry also failed: surface the FIRST attempt's error — it's the most
        // semantically relevant (e.g. lets the SDK detect missing-authority and
        // trigger the auth-upgrade flow) rather than the fallback node's error.
        throw new Error(extensionErrorMessage(response, "Extension broadcast failed"));
      });
    }

    throw new Error(extensionErrorMessage(response, "Extension broadcast failed"));
  });
}

// ---------------------------------------------------------------------------
// Internal: Peak Vault sign/broadcast (promise-based)
// ---------------------------------------------------------------------------

async function signBufferViaPeakVault(
  peakvault: PeakVaultApi,
  account: string,
  message: string,
  authType: AuthorityTypes
): Promise<TxResponse> {
  const keyRole = authType.toLowerCase();
  if (keyRole === "owner") {
    throw new Error("Owner authority not supported by Peak Vault.");
  }
  const resp = await peakvault.requestSignBuffer(account, keyRole as "posting" | "active" | "memo", message);
  if (!resp.success) {
    throw new Error(resp.error || "Operation cancelled");
  }
  return { success: true, result: resp.result } as TxResponse;
}

async function broadcastViaPeakVault(
  peakvault: PeakVaultApi,
  account: string,
  operations: any[],
  keyRole: "posting" | "active" | "memo"
): Promise<any> {
  const resp = await peakvault.requestBroadcast(account, operations, keyRole);
  if (!resp.success) {
    throw new Error(resp.error || "Extension broadcast failed");
  }
  return resp.result;
}
