import type { AuthContext } from "@ecency/sdk";
import type { Operation } from "@hiveio/dhive";
import type { HiveBasedAssetSignType } from "../../types";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";
import { broadcastWithKeychainFallback } from "../../utils/keychain-fallback";

export async function broadcastHiveEngineOperation(
  payload: { from: string; type: HiveBasedAssetSignType },
  operation: Operation,
  auth?: AuthContext
) {
  if (payload.type === "keychain") {
    // Use auth.broadcast if available (preferred method with full auth context)
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    // Fallback: Call Keychain extension directly if auth.broadcast is not available
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  }

  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  }

  throw new Error("[SDK][Wallets] – missing broadcaster");
}
