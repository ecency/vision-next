import { PrivateKey, type Operation } from "@hiveio/dhive";
import { HiveBasedAssetSignType } from "../../types";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

interface Payload<T extends HiveBasedAssetSignType> {
  from: string;
  amount: string;
  type: T;
}
export async function powerDownHive<T extends HiveBasedAssetSignType>(
  payload: T extends "key" ? Payload<T> & { key: PrivateKey } : Payload<T>
) {
  const operationPayload = {
    account: payload.from,
    vesting_shares: payload.amount,
  };

  const operation: Operation = ["withdraw_vesting", operationPayload];

  if (payload.type === "key" && "key" in payload) {
    const { key } = payload;
    return CONFIG.hiveClient.broadcast.sendOperations(
      [operation],
      key
    );
  } else if (payload.type === "keychain") {
    return Keychain.broadcast(payload.from, [operation], "Active") as Promise<unknown>;
  } else if (payload.type === "hiveauth") {
    return broadcastWithWalletHiveAuth(payload.from, [operation], "active");
  } else {
    return hs.sendOperation(operation, { callback: `https://ecency.com/@${payload.from}/wallet` }, () => {});
  }
}
