import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface Payload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  memo: string;
  type: T;
}

export async function transferToSavingsHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>,
  auth?: AuthContext
) {
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
  };
  const operation: Operation = ["transfer_to_savings", operationPayload];

  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_savings", params]],
      key
    );
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {});
  }
}
