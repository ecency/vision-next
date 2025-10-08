import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";

interface Payload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  memo: string;
  type: T;
}
export async function delegateHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>
) {
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["delegate_vesting_shares", params]],
      key
    );
  } else if (payload.type === "keychain") {
    return Keychain.broadcast(
      payload.from,
      [["delegate_vesting_shares", payload]],
      "Active"
    ) as Promise<unknown>;
  } else {
    return hs.sendOperation(
      ["delegate_vesting_shares", payload],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
