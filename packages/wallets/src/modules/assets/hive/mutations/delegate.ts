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
  const operationPayload = {
    delegator: payload.from,
    delegatee: payload.to,
    vesting_shares: payload.amount,
  };

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["delegate_vesting_shares", operationPayload]],
      key
    );
  } else if (payload.type === "keychain") {
    return Keychain.broadcast(
      payload.from,
      [["delegate_vesting_shares", operationPayload]],
      "Active"
    ) as Promise<unknown>;
  } else {
    return hs.sendOperation(
      ["delegate_vesting_shares", operationPayload],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
