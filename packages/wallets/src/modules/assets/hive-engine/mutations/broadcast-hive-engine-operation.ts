import type { AuthContext } from "@ecency/sdk";
import type { Operation } from "@hiveio/dhive";
import type { HiveBasedAssetSignType } from "../../types";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

export async function broadcastHiveEngineOperation(
  payload: { from: string; type: HiveBasedAssetSignType },
  operation: Operation,
  auth?: AuthContext
) {
  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  }

  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  }

  throw new Error("[SDK][Wallets] – missing broadcaster");
}
