import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import { PrivateKey, type Operation } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";
import { parseAsset } from "../../utils";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

export interface TransferEnginePayload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  memo: string;
  asset: string;
  type: T;
}

export async function transferEngineToken<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? TransferEnginePayload<T> & { key: PrivateKey }
    : TransferEnginePayload<T>,
  auth?: AuthContext
) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();

  const operation: Operation = [
    "custom_json",
    {
      id: "ssc-mainnet-hive",
      required_auths: [payload.from],
      required_posting_auths: [],
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: payload.asset,
          to: payload.to,
          quantity: quantity,
          memo: payload.memo,
        },
      }),
    },
  ];

  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;

    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity: quantity,
          memo: params.memo,
        },
      }),
      required_auths: [params.from],
      required_posting_auths: [],
    };

    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain" || payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], auth, "Active");
    }
    if (payload.type === "hiveauth") {
      return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
    }
    throw new Error("[SDK][Wallets] – missing keychain broadcaster");
  } else {
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
