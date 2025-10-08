import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";
import { parseAsset } from "../../utils";

interface SpkTransferPayload<T extends HiveBasedAssetSignType> {
  id: string;
  from: string;
  to: string;
  amount: string;
  memo?: string;
  type: T;
}

export async function transferSpk<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? SpkTransferPayload<T> & { key: PrivateKey }
    : SpkTransferPayload<T>
) {
  const json = JSON.stringify({
    to: payload.to,
    amount: +payload.amount * 1000,
    ...(typeof payload.memo === "string" ? { memo: payload.memo } : {}),
  });

  const op = {
    id: payload.id,
    json,
    required_auths: [payload.from],
    required_posting_auths: [],
  };

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return Keychain.customJson(
      payload.from,
      payload.id,
      "Active",
      json,
      payload.to
    ) as Promise<unknown>;
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: payload.id,
        json: JSON.stringify({
          to: payload.to,
          amount: +amount * 1000,
          ...(typeof payload.memo === "string" ? { memo: payload.memo } : {}),
        }),
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
}
