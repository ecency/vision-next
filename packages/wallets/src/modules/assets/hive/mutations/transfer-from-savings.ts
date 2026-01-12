import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import { PrivateKey, type Operation } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface PayloadBase {
  from: string;
  to: string;
  amount: string;
  memo: string;
  request_id?: number;
}

interface PayloadWithKey<T extends HiveBasedAssetSignType> extends PayloadBase {
  type: T;
}

export async function transferFromSavingsHive<
  T extends HiveBasedAssetSignType
>(
  payload: T extends "key"
    ? PayloadWithKey<T> & { key: PrivateKey }
    : PayloadWithKey<T>,
  auth?: AuthContext
) {
  const requestId = payload.request_id ?? (Date.now() >>> 0);
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
    request_id: requestId,
  };

  const operation: Operation = ["transfer_from_savings", operationPayload];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  }

  if (payload.type === "keychain" || payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    if (payload.type === "hiveauth") {
      return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  }

  return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {});
}
