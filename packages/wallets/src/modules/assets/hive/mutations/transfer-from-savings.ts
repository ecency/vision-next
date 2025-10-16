import { CONFIG, Keychain } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";

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
    : PayloadWithKey<T>
) {
  const requestId = payload.request_id ?? (Date.now() >>> 0);
  const operationPayload = {
    from: payload.from,
    to: payload.to,
    amount: payload.amount,
    memo: payload.memo,
    request_id: requestId,
  };

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [["transfer_from_savings", operationPayload]],
      key
    );
  }

  if (payload.type === "keychain") {
    return Keychain.broadcast(
      payload.from,
      [["transfer_from_savings", operationPayload]],
      "Active"
    ) as Promise<unknown>;
  }

  return hs.sendOperation(
    ["transfer_from_savings", operationPayload],
    { callback: `https://ecency.com/@${payload.from}/wallet` },
    () => {}
  );
}
