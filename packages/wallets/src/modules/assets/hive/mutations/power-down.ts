import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";

interface Payload<T extends HiveBasedAssetSignType> {
  from: string;
  amount: string;
  type: T;
}
export async function powerDownHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>
) {
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["withdraw_vesting", params]],
      key
    );
  } else if (payload.type === "keychain") {
    return Keychain.broadcast(
      payload.from,
      [["withdraw_vesting", payload]],
      "Active"
    ) as Promise<unknown>;
  } else {
    return hs.sendOperation(
      ["withdraw_vesting", payload],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
