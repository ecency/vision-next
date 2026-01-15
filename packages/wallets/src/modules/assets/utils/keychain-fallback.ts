import type { Operation } from "@hiveio/dhive";

/**
 * Fallback function to call Keychain extension directly when auth.broadcast is not available
 * This is used for active authority operations
 */
export async function broadcastWithKeychainFallback(
  account: string,
  operations: Operation[],
  authority: "Active" | "Posting" = "Active"
): Promise<any> {
  if (typeof window === "undefined" || !(window as any).hive_keychain) {
    throw new Error("[SDK][Wallets] – Keychain extension not found");
  }

  return new Promise((resolve, reject) => {
    (window as any).hive_keychain.requestBroadcast(
      account,
      operations,
      authority,
      (response: any) => {
        if (!response.success) {
          reject(new Error(response.message || "Keychain operation cancelled"));
          return;
        }
        resolve(response.result);
      }
    );
  });
}
