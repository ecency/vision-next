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

export async function transferToSavingsHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>
) {
  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_to_savings", params]],
      key
    );
  } else if (payload.type === "keychain") {
    return Keychain.broadcast(
      payload.from,
      [["transfer_to_savings", payload]],
      "Active"
    ) as Promise<unknown>;
  } else {
    return hs.sendOperation(
      ["transfer_to_savings", payload],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
