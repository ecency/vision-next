import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";
import { broadcastWithKeychainFallback } from "../../utils/keychain-fallback";

interface Payload<T extends HiveBasedAssetSignType> {
  from_account: string;
  to_account: string;
  percent: number;
  auto_vest: boolean;
  type: T;
}

export async function withdrawVestingRouteHive<
  T extends HiveBasedAssetSignType,
>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>,
  auth?: AuthContext
) {
  const baseParams = {
    from_account: payload.from_account,
    to_account: payload.to_account,
    percent: payload.percent,
    auto_vest: payload.auto_vest,
  };
  const operation: Operation = ["set_withdraw_vesting_route", baseParams];

  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["set_withdraw_vesting_route", params]],
      key
    );
  }

  if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithKeychainFallback(payload.from_account, [operation], "Active");
  }

  if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from_account, [operation], "active");
  }

  const { type, ...params } = payload as Payload<"hivesigner">;
  return hs.sendOperation(operation, { callback: `https://ecency.com/@${params.from_account}/wallet` }, () => {});
}
