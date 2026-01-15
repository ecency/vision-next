import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import { PrivateKey, type Operation } from "@hiveio/dhive";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";
import { broadcastWithKeychainFallback } from "../../utils/keychain-fallback";

const ENGINE_CONTRACT_ID = "ssc-mainnet-hive";

export type EngineOrderSignMethod =
  | "key"
  | "keychain"
  | "hivesigner"
  | "hiveauth";

export interface EngineOrderBroadcastOptions {
  method?: EngineOrderSignMethod;
  key?: PrivateKey;
  auth?: AuthContext;
}

function buildEngineOrderPayload(
  action: "buy" | "sell",
  symbol: string,
  quantity: string,
  price: string
) {
  return {
    contractName: "market",
    contractAction: action,
    contractPayload: { symbol, quantity, price },
  };
}

function buildEngineCancelPayload(type: "buy" | "sell", orderId: string) {
  return {
    contractName: "market",
    contractAction: "cancel",
    contractPayload: { type, id: orderId },
  };
}

function buildEngineOperation(
  account: string,
  payload: ReturnType<typeof buildEngineOrderPayload> | ReturnType<typeof buildEngineCancelPayload>
) {
  return {
    id: ENGINE_CONTRACT_ID,
    required_auths: [account],
    required_posting_auths: [],
    json: JSON.stringify(payload),
  };
}

async function broadcastEngineOperation(
  account: string,
  payload: ReturnType<typeof buildEngineOrderPayload> | ReturnType<typeof buildEngineCancelPayload>,
  options?: EngineOrderBroadcastOptions
) {
  const operation = buildEngineOperation(account, payload);
  const opTuple: Operation = ["custom_json", operation];

  switch (options?.method) {
    case "key": {
      if (!options.key) {
        throw new Error("[SDK][Wallets] – active key is required");
      }
      return CONFIG.hiveClient.broadcast.json(operation, options.key);
    }
    case "keychain": {
      // Use auth.broadcast if available (preferred method with full auth context)
      if (options.auth?.broadcast) {
        return options.auth.broadcast([opTuple], "active");
      }
      // Fallback: Call Keychain extension directly if auth.broadcast is not available
      return broadcastWithKeychainFallback(account, [opTuple], "Active");
    }
    case "hiveauth": {
      if (options.auth?.broadcast) {
        return options.auth.broadcast([opTuple], "active");
      }
      return broadcastWithWalletHiveAuth(account, [opTuple], "active");
    }
    case "hivesigner":
      return hs.sendOperation(
        opTuple,
        { callback: `https://ecency.com/@${account}/wallet/engine` },
        () => {}
      );
    default:
      throw new Error("[SDK][Wallets] – broadcast method is required");
  }
}

export const placeHiveEngineBuyOrder = async (
  account: string,
  symbol: string,
  quantity: string,
  price: string,
  options?: EngineOrderBroadcastOptions
) =>
  broadcastEngineOperation(
    account,
    buildEngineOrderPayload("buy", symbol, quantity, price),
    options
  );

export const placeHiveEngineSellOrder = async (
  account: string,
  symbol: string,
  quantity: string,
  price: string,
  options?: EngineOrderBroadcastOptions
) =>
  broadcastEngineOperation(
    account,
    buildEngineOrderPayload("sell", symbol, quantity, price),
    options
  );

export const cancelHiveEngineOrder = async (
  account: string,
  type: "buy" | "sell",
  orderId: string,
  options?: EngineOrderBroadcastOptions
) =>
  broadcastEngineOperation(
    account,
    buildEngineCancelPayload(type, orderId),
    options
  );
