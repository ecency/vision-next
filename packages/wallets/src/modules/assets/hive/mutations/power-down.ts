import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";
import { broadcastWithKeychainFallback } from "../../utils/keychain-fallback";

interface Payload<T extends HiveBasedAssetSignType> {
  from: string;
  amount: string;
  type: T;
}
export async function powerDownHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>,
  auth?: AuthContext
) {
  const operationPayload = {
    account: payload.from,
    vesting_shares: payload.amount,
  };

  const operation: Operation = ["withdraw_vesting", operationPayload];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from, [operation], "Active");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {});
  }
}
