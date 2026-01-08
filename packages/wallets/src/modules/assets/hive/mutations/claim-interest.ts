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

export async function claimInterestHive<
  T extends HiveBasedAssetSignType
>(
  payload: T extends "key"
    ? PayloadWithKey<T> & { key: PrivateKey }
    : PayloadWithKey<T>,
  auth?: AuthContext
) {
  const requestId = payload.request_id ?? (Date.now() >>> 0);
  const baseOperation = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
    request_id: requestId,
  };

  const cancelOperation = {
    from: payload.from,
    request_id: requestId,
  };

  const operations: Operation[] = [
    ["transfer_from_savings", baseOperation],
    ["cancel_transfer_from_savings", cancelOperation],
  ];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(operations, key);
  }

  if (payload.type === "keychain" || payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast(operations, auth, "Active");
    }
    if (payload.type === "hiveauth") {
      return broadcastWithWalletHiveAuth(payload.from, operations, "active");
    }
    throw new Error("[SDK][Wallets] – missing keychain broadcaster");
  }

  return hs.sendOperations(operations, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {});
}
