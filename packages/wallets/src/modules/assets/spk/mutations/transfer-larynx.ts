import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";
import { parseAsset } from "../../utils";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface LarynxTransferPayload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  memo?: string;
  type: T;
}

export async function transferLarynx<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? LarynxTransferPayload<T> & { key: PrivateKey }
    : LarynxTransferPayload<T>
) {
  const json = JSON.stringify({
    to: payload.to,
    amount: parseAsset(payload.amount).amount * 1000,
    ...(typeof payload.memo === "string" ? { memo: payload.memo } : {}),
  });

  const op = {
    id: "spkcc_send",
    json,
    required_auths: [payload.from],
    required_posting_auths: [],
  };

  const operation: Operation = [
    "custom_json",
    {
      id: "spkcc_send",
      required_auths: [payload.from],
      required_posting_auths: [],
      json,
    },
  ];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return Keychain.customJson(
      payload.from,
      "spkcc_send",
      "Active",
      json,
      payload.to
    ) as Promise<unknown>;
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: "spkcc_send",
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
