import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import type { Operation, PrivateKey } from "@hiveio/dhive";
import hs from "hivesigner";
import type { HiveBasedAssetSignType } from "../types";
import { broadcastWithWalletHiveAuth } from "./hive-auth";
import { broadcastWithKeychainFallback } from "./keychain-fallback";

interface BroadcastPayload {
  from: string;
  type: HiveBasedAssetSignType;
  key?: PrivateKey;
}

/**
 * Generic broadcast utility for active authority Hive operations.
 * Handles all 4 auth types: key, keychain, hiveauth, hivesigner.
 */
export async function broadcastActiveOperation(
  payload: BroadcastPayload,
  operations: Operation[],
  auth?: AuthContext
) {
  if (payload.type === "key" && payload.key) {
    return CONFIG.hiveClient.broadcast.sendOperations(operations, payload.key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithKeychainFallback(payload.from, operations, "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, operations, "active");
  } else {
    // hivesigner
    return hs.sendOperation(
      operations[0],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
