import type { AuthContext } from "@ecency/sdk";
import type { Operation } from "@hiveio/dhive";
import type { HiveBasedAssetSignType } from "../../types";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

export async function broadcastHiveEngineOperation(
  payload: { from: string; type: HiveBasedAssetSignType },
  operation: Operation,
  auth?: AuthContext
) {
  if (payload.type === "keychain" || payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    if (payload.type === "hiveauth") {
      return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
    }

    if (payload.type === "keychain") {
      throw new Error("[SDK][Wallets] – keychain requires auth.broadcast");
    }
  }

  throw new Error("[SDK][Wallets] – missing broadcaster");
}
