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

import { AuthorityTypes, TxResponse } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HiveExtensionId = "keychain" | "hive-keeper" | "peakvault";

export interface DetectedExtension {
  id: HiveExtensionId;
  name: string;
  icon: string;
}

interface PeakVaultResponse {
  success: boolean;
  error: string;
  account: string;
  publicKey?: string;
  result: any;
}

interface PeakVaultInstance {
  requestBroadcast: (
    account: string,
    operations: any[],
    keyRole: "posting" | "active" | "memo",
    displayMessage?: string
  ) => Promise<PeakVaultResponse>;
  requestSignBuffer: (
    account: string,
    keyRole: "posting" | "active" | "memo",
    message: string,
    displayMessage?: string
  ) => Promise<PeakVaultResponse>;
  connect: (account: string, keyRole?: "posting" | "active" | "memo") => Promise<PeakVaultResponse>;
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
      icon: "/assets/hive-keeper.png"
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
  authType: AuthorityTypes = "Posting"
): Promise<TxResponse> {
  // Peak Vault uses different API - try Keychain-compatible first
  const keychainLike = getKeychainLikeInstance();
  if (keychainLike) {
    return signBufferViaKeychain(keychainLike, account, message, authType);
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
  keyType: "posting" | "active" | "owner" | "memo"
): Promise<any> {
  const keychainLike = getKeychainLikeInstance();
  if (keychainLike) {
    return broadcastViaKeychain(keychainLike, account, operations, keyType);
  }

  const peakvault = getPeakVaultInstance();
  if (peakvault) {
    // Peak Vault doesn't support "owner" key role
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

function getKeychainLikeInstance(): any | null {
  if (typeof window === "undefined") return null;
  // Hive Keychain
  if ((window as any).hive_keychain) return (window as any).hive_keychain;
  // Hive Keeper (only when hive_extension flag confirms it's the extension, not an unrelated window.hive)
  if ((window as any).hive && (window as any).hive_extension) return (window as any).hive;
  return null;
}

function getPeakVaultInstance(): PeakVaultInstance | null {
  if (typeof window === "undefined") return null;
  return (window as any).peakvault ?? null;
}

// ---------------------------------------------------------------------------
// Internal: Keychain-compatible sign/broadcast (callback-based)
// ---------------------------------------------------------------------------

function signBufferViaKeychain(
  keychain: any,
  account: string,
  message: string,
  authType: AuthorityTypes
): Promise<TxResponse> {
  return new Promise((resolve, reject) => {
    keychain.requestSignBuffer(
      account,
      message,
      authType,
      (resp: TxResponse) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }
        resolve(resp);
      },
      null
    );
  });
}

function broadcastViaKeychain(
  keychain: any,
  account: string,
  operations: any[],
  keyType: string
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
    const authorityType = keyType.charAt(0).toUpperCase() + keyType.slice(1);

    keychain.requestBroadcast(
      account,
      operations,
      authorityType,
      (response: any) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(response.message || "Extension broadcast failed"));
          }
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Internal: Peak Vault sign/broadcast (promise-based)
// ---------------------------------------------------------------------------

function signBufferViaPeakVault(
  peakvault: PeakVaultInstance,
  account: string,
  message: string,
  authType: AuthorityTypes
): Promise<TxResponse> {
  // Peak Vault uses lowercase key roles
  const keyRole = authType.toLowerCase() as "posting" | "active" | "memo";
  // Peak Vault signBuffer param order: (account, keyRole, message, displayMessage?)
  return peakvault.requestSignBuffer(account, keyRole, message).then((resp) => {
    if (!resp.success) {
      throw new Error(resp.error || "Operation cancelled");
    }
    // Normalize to TxResponse format
    return { success: true, result: resp.result } as TxResponse;
  });
}

function broadcastViaPeakVault(
  peakvault: PeakVaultInstance,
  account: string,
  operations: any[],
  keyRole: "posting" | "active" | "memo"
): Promise<any> {
  return peakvault.requestBroadcast(account, operations, keyRole).then((resp) => {
    if (!resp.success) {
      throw new Error(resp.error || "Extension broadcast failed");
    }
    return resp.result;
  });
}
