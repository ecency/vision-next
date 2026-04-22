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

function signBufferViaKeychain(
  keychain: KeyChainImpl,
  account: string,
  message: string,
  authType: AuthorityTypes,
  rpc: string | null
): Promise<TxResponse> {
  return new Promise((resolve, reject) => {
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
          reject(new Error("Operation cancelled"));
          return;
        }
        resolve(resp);
      },
      rpc
    );
  });
}

function broadcastViaKeychain(
  keychain: KeyChainImpl,
  account: string,
  operations: any[],
  keyType: string,
  rpc: string | null
): Promise<any> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Extension request timed out. Please try again."));
      }
    }, 60000);

    // Map SDK key types to Keychain authority types (capitalized)
    const authorityType = (keyType.charAt(0).toUpperCase() + keyType.slice(1)) as AuthorityTypes;

    keychain.requestBroadcast(
      account,
      operations,
      authorityType,
      (response: TxResponse) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error("Extension broadcast failed"));
        }
      },
      rpc
    );
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
