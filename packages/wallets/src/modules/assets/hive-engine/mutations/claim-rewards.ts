import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import { PrivateKey, type Operation } from "@hiveio/dhive";
import hs from "hivesigner";
import { HiveBasedAssetSignType } from "../../types";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface ClaimRewardsPayload<T extends HiveBasedAssetSignType> {
  account: string;
  tokens: string[];
  type: T;
}

export async function claimHiveEngineRewards<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? ClaimRewardsPayload<T> & { key: PrivateKey } : ClaimRewardsPayload<T>,
  auth?: AuthContext
) {
  const json = JSON.stringify(payload.tokens.map((symbol) => ({ symbol })));
  const operation: Operation = [
    "custom_json",
    {
      id: "scot_claim_token",
      required_auths: [],
      required_posting_auths: [payload.account],
      json,
    },
  ];

  if (payload.type === "key" && "key" in payload) {
    return CONFIG.hiveClient.broadcast.sendOperations([operation], payload.key);
  }

  if (payload.type === "keychain" || payload.type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([operation], "posting");
    }
    if (payload.type === "hiveauth") {
      return broadcastWithWalletHiveAuth(payload.account, [operation], "posting");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  }

  return hs.sendOperation(
    operation,
    { callback: `https://ecency.com/@${payload.account}/wallet/engine` },
    () => {}
  );
}
