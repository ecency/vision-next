import Decimal from "decimal.js";
import { HiveEngineToken, hotSign } from "@/utils";
import {
  Operation,
  PrivateKey,
  TransactionConfirmation
} from "@hiveio/dhive";
import { broadcastActiveJSON, broadcastPostingJSON } from "./operations";
import engine from "@/engine.json";
import { apiBase } from "./helper";
import {
  HiveEngineOpenOrder,
  HiveEngineOrderBookEntry,
  HiveEngineTradeHistoryEntry,
  Token,
  TokenBalance,
  TokenMetadata,
  TokenStatus
} from "@/entities";
import { appAxios } from "@/api/axios";
import * as keychain from "@/utils/keychain";
import { broadcastWithHiveAuth } from "@/utils/hive-auth";
import { client as hiveClient } from "./hive";

const ENGINE_CONTRACT_ID = "ssc-mainnet-hive";
const ENGINE_RPC_HEADERS = { headers: { "Content-type": "application/json" } };

export type EngineOrderSignMethod = "key" | "keychain" | "hivesigner" | "hiveauth";

export interface EngineOrderBroadcastOptions {
  method?: EngineOrderSignMethod;
  key?: PrivateKey;
}

const ENGINE_ORDER_MESSAGES: Record<"buy" | "sell" | "cancel", string> = {
  buy: "Engine buy order",
  sell: "Engine sell order",
  cancel: "Cancel engine order"
};

function buildEngineOrderPayload(
  action: "buy" | "sell",
  symbol: string,
  quantity: string,
  price: string
) {
  return {
    contractName: "market",
    contractAction: action,
    contractPayload: {
      symbol,
      quantity,
      price
    }
  };
}

function buildEngineCancelPayload(type: "buy" | "sell", orderId: string) {
  return {
    contractName: "market",
    contractAction: "cancel",
    contractPayload: {
      type,
      id: orderId
    }
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
    json: JSON.stringify(payload)
  };
}

function broadcastEngineOperation(
  account: string,
  payload: ReturnType<typeof buildEngineOrderPayload> | ReturnType<typeof buildEngineCancelPayload>,
  action: "buy" | "sell" | "cancel",
  options?: EngineOrderBroadcastOptions
): Promise<TransactionConfirmation> {
  if (!options?.method) {
    return broadcastActiveJSON(account, ENGINE_CONTRACT_ID, payload, ENGINE_ORDER_MESSAGES[action]);
  }

  const operation = buildEngineOperation(account, payload);
  const opTuple: Operation = ["custom_json", operation];

  switch (options.method) {
    case "key": {
      if (!options.key) {
        return Promise.reject(new Error("Active key is required"));
      }
      return hiveClient.broadcast.json(operation, options.key);
    }
    case "keychain":
      return keychain
        .customJson(
          account,
          ENGINE_CONTRACT_ID,
          "Active",
          operation.json,
          ENGINE_ORDER_MESSAGES[action]
        )
        .then((r: any) => r.result);
    case "hiveauth":
      return broadcastWithHiveAuth(account, [opTuple], "active");
    case "hivesigner": {
      hotSign(
        "custom-json",
        {
          authority: "active",
          required_auths: JSON.stringify([account]),
          required_posting_auths: "[]",
          id: ENGINE_CONTRACT_ID,
          json: operation.json,
          display_msg: ENGINE_ORDER_MESSAGES[action]
        },
        `@${account}/wallet/engine`
      );

      return Promise.resolve(0 as unknown as TransactionConfirmation);
    }
    default:
      return broadcastActiveJSON(account, ENGINE_CONTRACT_ID, payload, ENGINE_ORDER_MESSAGES[action]);
  }
}

async function engineRpc<T>(payload: Record<string, any>): Promise<T> {
  const response = await appAxios.post<{ result: T }>(apiBase(engine.API), payload, ENGINE_RPC_HEADERS);
  return response.data.result;
}

async function engineRpcSafe<T>(payload: Record<string, any>, fallback: T): Promise<T> {
  try {
    return await engineRpc<T>(payload);
  } catch (e) {
    return fallback;
  }
}

export const getTokenBalances = (account: string): Promise<TokenBalance[]> => {
  const data = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "tokens",
      table: "balances",
      query: {
        account: account
      }
    },
    id: 1
  };

  return engineRpcSafe<TokenBalance[]>(data, []);
};

export const getTokens = (tokens: string[]): Promise<Token[]> => {
  const data = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "tokens",
      table: "tokens",
      query: {
        symbol: { $in: tokens }
      }
    },
    id: 2
  };

  return engineRpcSafe<Token[]>(data, []);
};

export const getHiveEngineTokenBalances = async (account: string): Promise<HiveEngineToken[]> => {
  // commented just to try removing the non-existing unknowing HiveEngineTokenBalance type
  // ): Promise<HiveEngineTokenBalance[]> => {
  const balances = await getTokenBalances(account);
  const tokens = await getTokens(balances.map((t) => t.symbol));

  return balances.map((balance) => {
    const token = tokens.find((t) => t.symbol == balance.symbol);
    const tokenMetadata = token && (JSON.parse(token!.metadata) as TokenMetadata);

    return new HiveEngineToken({ ...balance, ...token, ...tokenMetadata } as any);
  });
};

export const getUnclaimedRewards = async (account: string): Promise<TokenStatus[]> => {
  return (
    appAxios
      .get(apiBase(`${engine.rewardAPI}/${account}?hive=1`))
      .then((r) => r.data)
      .then((r) => Object.values(r))
      .then((r) => r.filter((t) => (t as TokenStatus).pending_token > 0)) as any
  ).catch(() => {
    return [];
  });
};

export const claimRewards = async (
  account: string,
  tokens: string[]
): Promise<TransactionConfirmation> => {
  const json = JSON.stringify(
    tokens.map((r) => {
      return { symbol: r };
    })
  );

  return broadcastPostingJSON(account, "scot_claim_token", json);
};

export const getEngineOrderBook = async (
  symbol: string,
  limit: number = 50
): Promise<{ buy: HiveEngineOrderBookEntry[]; sell: HiveEngineOrderBookEntry[] }> => {
  const commonParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: {
        symbol
      },
      limit,
      offset: 0
    },
    id: 1
  };

  const [buy, sell] = await Promise.all([
    engineRpcSafe<HiveEngineOrderBookEntry[]>(
      {
        ...commonParams,
        params: {
          ...commonParams.params,
          table: "buyBook",
          indexes: [{ index: "price", descending: true }]
        }
      },
      []
    ),
    engineRpcSafe<HiveEngineOrderBookEntry[]>(
      {
        ...commonParams,
        params: {
          ...commonParams.params,
          table: "sellBook",
          indexes: [{ index: "price", descending: false }]
        }
      },
      []
    )
  ]);

  return { buy, sell };
};

export const getEngineTradeHistory = async (
  symbol: string,
  limit: number = 50
): Promise<HiveEngineTradeHistoryEntry[]> => {
  const payload = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      table: "tradesHistory",
      query: {
        symbol
      },
      limit,
      offset: 0,
      indexes: [{ index: "timestamp", descending: true }]
    },
    id: 1
  };

  return engineRpcSafe<HiveEngineTradeHistoryEntry[]>(payload, []);
};

export const getEngineOpenOrders = async (
  account: string,
  symbol: string,
  limit: number = 100
): Promise<HiveEngineOpenOrder[]> => {
  const baseParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: {
        symbol,
        account
      },
      limit,
      offset: 0
    },
    id: 1
  };

  const [buyRaw, sellRaw] = await Promise.all([
    engineRpcSafe<HiveEngineOrderBookEntry[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "buyBook",
          indexes: [{ index: "timestamp", descending: true }]
        }
      },
      []
    ),
    engineRpcSafe<HiveEngineOrderBookEntry[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "sellBook",
          indexes: [{ index: "timestamp", descending: true }]
        }
      },
      []
    )
  ]);

  const formatTotal = (quantity: string, price: string) =>
    new Decimal(quantity || 0).mul(new Decimal(price || 0)).toFixed(8);

  const buy: HiveEngineOpenOrder[] = buyRaw.map((order) => ({
    id: order.txId,
    type: "buy",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: order.tokensLocked ?? formatTotal(order.quantity, order.price),
    timestamp: order.timestamp
  }));

  const sell: HiveEngineOpenOrder[] = sellRaw.map((order) => ({
    id: order.txId,
    type: "sell",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: formatTotal(order.quantity, order.price),
    timestamp: order.timestamp
  }));

  return [...buy, ...sell].sort((a, b) => b.timestamp - a.timestamp);
};

export const placeEngineBuyOrder = async (
  account: string,
  symbol: string,
  quantity: string,
  price: string,
  options?: EngineOrderBroadcastOptions
): Promise<TransactionConfirmation> =>
  broadcastEngineOperation(
    account,
    buildEngineOrderPayload("buy", symbol, quantity, price),
    "buy",
    options
  );

export const placeEngineSellOrder = async (
  account: string,
  symbol: string,
  quantity: string,
  price: string,
  options?: EngineOrderBroadcastOptions
): Promise<TransactionConfirmation> =>
  broadcastEngineOperation(
    account,
    buildEngineOrderPayload("sell", symbol, quantity, price),
    "sell",
    options
  );

export const cancelEngineOrder = async (
  account: string,
  type: "buy" | "sell",
  orderId: string,
  options?: EngineOrderBroadcastOptions
): Promise<TransactionConfirmation> =>
  broadcastEngineOperation(
    account,
    buildEngineCancelPayload(type, orderId),
    "cancel",
    options
  );

export const getMetrics: any = async (symbol?: any, account?: any) => {
  const data = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      table: "metrics",
      query: {
        symbol: symbol,
        account: account
      }
    },
    id: 1
  };

  // const result = await appAxios
  //     .post(HIVE_ENGINE_RPC_URL, data, {
  //       headers: { "Content-type": "application/json" }
  //     })
  //     return result;
  return appAxios
    .post(apiBase(engine.API), data, {
      headers: { "Content-type": "application/json" }
    })
    .then((r) => r.data.result)
    .catch((e) => {
      return [];
    });
};
