import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import hs from "hivesigner";
import { parseAsset } from "../../utils";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface SpkPowerPayload<T extends HiveBasedAssetSignType> {
  mode: "up" | "down";
  from: string;
  amount: string;
  type: T;
}

export async function powerUpLarynx<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? SpkPowerPayload<T> & { key: PrivateKey }
    : SpkPowerPayload<T>,
  auth?: AuthContext
) {
  const json = JSON.stringify({ amount: +payload.amount * 1000 });

  const op = {
    id: `spkcc_power_${payload.mode}`,
    json,
    required_auths: [payload.from],
    required_posting_auths: [],
  };

  const operation: Operation = [
    "custom_json",
    {
      id: `spkcc_power_${payload.mode}`,
      required_auths: [payload.from],
      required_posting_auths: [],
      json,
    },
  ];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  } else if (payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "active");
    }
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
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
