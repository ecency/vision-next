import type { Operation, TransactionConfirmation } from "@hiveio/dhive";
import {
  getHiveAuthBroadcastHandler,
  registerHiveAuthBroadcastHandler,
  type HiveAuthBroadcastHandler,
} from "../../../internal/hive-auth";

export type { HiveAuthBroadcastHandler } from "../../../internal/hive-auth";

export type HiveAuthKeyType = "posting" | "active";

export function registerWalletHiveAuthBroadcast(handler: HiveAuthBroadcastHandler) {
  registerHiveAuthBroadcastHandler(handler);
}

export function broadcastWithWalletHiveAuth(
  username: string,
  operations: Operation[],
  keyType: HiveAuthKeyType
): Promise<TransactionConfirmation> {
  const handler = getHiveAuthBroadcastHandler();
  if (!handler) {
    throw new Error("HiveAuth broadcast handler is not registered");
  }

  return handler(username, operations, keyType);
}

export function hasWalletHiveAuthBroadcast(): boolean {
  return typeof getHiveAuthBroadcastHandler() === "function";
}
