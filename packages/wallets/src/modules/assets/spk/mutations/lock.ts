import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";
import { parseAsset } from "../../utils";

interface SpkLockPayload<T extends HiveBasedAssetSignType> {
  mode: "lock" | "unlock";
  from: string;
  amount: string;
  type: T;
}

export const lockLarynx = async <T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? SpkLockPayload<T> & { key: PrivateKey }
    : SpkLockPayload<T>
) => {
  const json = JSON.stringify({ amount: +payload.amount * 1000 });

  const op = {
    id: payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down",
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
      op.id,
      "Active",
      json,
      payload.from
    ) as Promise<unknown>;
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: op.id,
        json: JSON.stringify({ amount: +amount * 1000 }),
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
};
