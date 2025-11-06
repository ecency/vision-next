import { CONFIG } from "@ecency/sdk";
import { PrivateKey, type Operation } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";
import { Symbol as AssetSymbol, parseAsset } from "../../utils";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

export interface TransferPayload<T extends HiveBasedAssetSignType> {
  from: string;
  to: string;
  amount: string;
  memo: string;
  type: T;
}

export async function transferHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key"
    ? TransferPayload<T> & { key: PrivateKey }
    : TransferPayload<T>
) {
  const parsedAsset = parseAsset(payload.amount);
  const token = parsedAsset.symbol;
  const precision = token === AssetSymbol.VESTS ? 6 : 3;
  const formattedAmount = parsedAsset.amount.toFixed(precision);
  const amountWithSymbol = `${formattedAmount} ${token}`;

  const operation: Operation = [
    "transfer",
    {
      from: payload.from,
      to: payload.to,
      amount: amountWithSymbol,
      memo: payload.memo,
    },
  ];

  if (payload.type === "key" && "key" in payload) {
    const { key, type, ...params } = payload;
    // params contains from, to, amount, memo
    // broadcast.transfer expects amount string like "1.000 HIVE" or "1.000 HBD"
    return CONFIG.hiveClient.broadcast.transfer(
      {
        from: params.from,
        to: params.to,
        amount: amountWithSymbol,
        memo: params.memo,
      },
      key
    );
  } else if (payload.type === "keychain") {
    return new Promise((resolve, reject) =>
      (window as any).hive_keychain?.requestTransfer(
        payload.from,
        payload.to,
        formattedAmount,
        payload.memo,
        token,
        (resp: { success: boolean }) => {
          if (!resp.success) {
            reject({ message: "Operation cancelled" });
          }

          resolve(resp);
        },
        true,
        null
      )
    );
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    // For hivesigner, include the same payload fields; amount already contains token denomination
    return hs.sendOperation(
      operation,
      { callback: `https://ecency.com/@${payload.from}/wallet` },
      () => {}
    );
  }
}
