import { CONFIG } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";
import { parseAsset } from "../../utils";

export interface StakeEnginePayload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  asset: string;
  type: T;
}

export async function stakeEngineToken<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? StakeEnginePayload<T> & { key: PrivateKey }
    : StakeEnginePayload<T>
) {
  const parsedAsset = parseAsset(payload.amount);
  const quantity = parsedAsset.amount.toString();

  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;

    const op = {
      id: "ssc-mainnet-hive",
      json: JSON.stringify({
        contractName: "tokens",
        contractAction: "stake",
        contractPayload: {
          symbol: params.asset,
          to: params.to,
          quantity: quantity,
        },
      }),
      required_auths: [params.from],
      required_posting_auths: [],
    };

    return CONFIG.hiveClient.broadcast.json(op, key);
  } else if (payload.type === "keychain") {
    return new Promise((resolve, reject) =>
      (window as any).hive_keychain?.requestCustomJson(
        payload.from,
        "ssc-mainnet-hive",
        "Active",
        JSON.stringify({
          contractName: "tokens",
          contractAction: "stake",
          contractPayload: {
            symbol: payload.asset,
            to: payload.to,
            quantity: quantity,
          },
        }),
        "Token Staking",
        (resp: { success: boolean }) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }

          resolve(resp);
        }
      )
    );
  } else {
    return hs.sendOperation(
      [
        "custom_json",
        {
          id: "ssc-mainnet-hive",
          required_auths: [payload.from],
          required_posting_auths: [],
          json: JSON.stringify({
            contractName: "tokens",
            contractAction: "stake",
            contractPayload: {
              symbol: payload.asset,
              to: payload.to,
              quantity: quantity,
            },
          }),
        },
      ],
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
