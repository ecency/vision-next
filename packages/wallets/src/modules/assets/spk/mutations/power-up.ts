import { PrivateKey } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";
import { parseAsset } from "../../utils";

interface SpkPowerPayload<T extends HiveBasedAssetSignType> {
  mode: "up" | "down";
  from: string;
  amount: string;
  type: T;
}

export async function powerUpLarynx<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? SpkPowerPayload<T> & { key: PrivateKey }
    : SpkPowerPayload<T>
) {
  const json = JSON.stringify({ amount: +payload.amount * 1000 });

  const op = {
    id: `spkcc_power_${payload.mode}`,
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
      `spkcc_power_${payload.mode}`,
      "Active",
      json,
      ""
    ) as Promise<unknown>;
  } else {
    const { amount } = parseAsset(payload.amount);
    return hs.sign(
      "custom_json",
      {
        authority: "active",
        required_auths: `["${payload.from}"]`,
        required_posting_auths: "[]",
        id: `spkcc_power_${payload.mode}`,
        json: JSON.stringify({ amount: +amount * 1000 }),
      },
      `https://ecency.com/@${payload.from}/wallet`
    );
  }
}
