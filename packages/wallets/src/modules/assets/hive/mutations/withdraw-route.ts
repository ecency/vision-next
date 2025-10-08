import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";

interface Payload<T extends HiveBasedAssetSignType> {
  from_account: string;
  to_account: string;
  percent: number;
  auto_vest: boolean;
  type: T;
}

export async function withdrawVestingRouteHive<
  T extends HiveBasedAssetSignType,
>(payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>) {
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["set_withdraw_vesting_route", params]],
      key
    );
  }

  if (payload.type === "keychain") {
    const { type, ...params } = payload as Payload<"keychain">;
    return Keychain.broadcast(
      params.from_account,
      [["set_withdraw_vesting_route", params]],
      "Active"
    ) as Promise<unknown>;
  }

  const { type, ...params } = payload as Payload<"hivesigner">;
  return hs.sendOperation(
    ["set_withdraw_vesting_route", params],
    { callback: `https://ecency.com/@${params.from_account}/wallet` },
    () => {}
  );
}
