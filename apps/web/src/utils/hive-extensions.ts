/**
 * Unified Hive Browser Extensions abstraction.
 *
 * Supports three extensions:
 * - Hive Keychain (window.hive_keychain)
 * - Hive Keeper (window.hive) - Ecency's extension, API-compatible with Keychain
 * - Peak Vault (window.peakvault) - PeakD's extension, promise-based API
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

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Returns a list of all currently detected Hive browser extensions.
 * Call this at render time to build the UI.
 */
export function getDetectedExtensions(): DetectedExtension[] {
  if (typeof window === "undefined") return [];

  const detected: DetectedExtension[] = [];

  // Hive Keeper exposes window.hive and sets window.hive_extension = true
  if ((window as any).hive && (window as any).hive_extension) {
    detected.push({
      id: "hive-keeper",
      name: "Hive Keeper",
      icon: "/assets/keeper.svg"
    });
  }
  // Hive Keychain (only if Hive Keeper didn't already alias it)
  else if ((window as any).hive_keychain) {
    detected.push({
      id: "keychain",
      name: "Keychain",
      icon: "/assets/keychain.png"
    });
  }

  // Peak Vault
  if ((window as any).peakvault) {
    detected.push({
      id: "peakvault",
      name: "Peak Vault",
      icon: "/assets/peakvault.svg"
    });
  }

  return detected;
}

/**
 * Returns true if any Hive browser extension is available.
 * Uses the same predicates as getDetectedExtensions() to avoid false positives
 * from unrelated window.hive objects.
 */
export function hasAnyHiveExtension(): boolean {
  if (typeof window === "undefined") return false;
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
// Unified Sign Buffer
// ---------------------------------------------------------------------------

/**
 * Sign a message buffer using whichever extension is available.
 * Returns the signature result string on success.
 */
export function signBufferWithExtension(
  account: string,
  message: string,
  authType: AuthorityTypes = "Posting",
  rpc: string | null = null
): Promise<TxResponse> {
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
 * Broadcast operations using whichever extension is available.
 * Returns the transaction confirmation on success.
 */
export function broadcastWithExtension(
  account: string,
  operations: any[],
  keyType: "posting" | "active" | "owner" | "memo",
  rpc: string | null = null
): Promise<any> {
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

/**
 * Returns the Keychain-compatible extension instance.
 * Priority: Hive Keeper (guarded by hive_extension) > Keychain.
 * Matches getPreferredExtension() ordering so signing uses the same extension shown in the UI.
 */
function getKeychainLikeInstance(): KeyChainImpl | null {
  if (typeof window === "undefined") return null;
  // Hive Keeper (only when hive_extension flag confirms it's the real extension)
  if ((window as any).hive && (window as any).hive_extension) return (window as any).hive;
  // Hive Keychain
  if ((window as any).hive_keychain) return (window as any).hive_keychain;
  return null;
}

function getPeakVaultInstance(): PeakVaultApi | null {
  if (typeof window === "undefined") return null;
  return (window as any).peakvault ?? null;
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
  const keyRole = authType.toLowerCase() as "posting" | "active" | "memo";
  const resp = await peakvault.requestSignBuffer(account, keyRole, message);
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
