import { ConfigManager, getBoundFetch } from "@/modules/core";
import type { HiveEngineOpenOrder } from "./types";

type EngineOrderBookEntry = {
  txId: string;
  timestamp: number;
  account: string;
  symbol: string;
  quantity: string;
  price: string;
  tokensLocked?: string;
};

const ENGINE_RPC_HEADERS = { "Content-type": "application/json" };

async function engineRpc<T>(payload: Record<string, unknown>): Promise<T> {
  const fetchApi = getBoundFetch();
  const baseUrl = ConfigManager.getValidatedBaseUrl();
  const response = await fetchApi(`${baseUrl}/private-api/engine-api`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: ENGINE_RPC_HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] – request failed with ${response.status}`
    );
  }

  const data = (await response.json()) as { result: T };
  return data.result;
}

async function engineRpcSafe<T>(
  payload: Record<string, unknown>,
  fallback: T
): Promise<T> {
  try {
    return await engineRpc<T>(payload);
  } catch (e) {
    return fallback;
  }
}

export async function getHiveEngineOrderBook<T = EngineOrderBookEntry>(
  symbol: string,
  limit: number = 50
): Promise<{ buy: T[]; sell: T[] }> {
  const baseParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: { symbol },
      limit,
      offset: 0,
    },
    id: 1,
  };

  const [buy, sell] = await Promise.all([
    engineRpcSafe<T[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "buyBook",
          indexes: [{ index: "price", descending: true }],
        },
      },
      []
    ),
    engineRpcSafe<T[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "sellBook",
          indexes: [{ index: "price", descending: false }],
        },
      },
      []
    ),
  ]);

  const sortByPriceDesc = (items: T[]) =>
    items.sort((a, b) => {
      const left = Number((a as EngineOrderBookEntry).price ?? 0);
      const right = Number((b as EngineOrderBookEntry).price ?? 0);
      return right - left;
    });
  const sortByPriceAsc = (items: T[]) =>
    items.sort((a, b) => {
      const left = Number((a as EngineOrderBookEntry).price ?? 0);
      const right = Number((b as EngineOrderBookEntry).price ?? 0);
      return left - right;
    });

  return {
    buy: sortByPriceDesc(buy),
    sell: sortByPriceAsc(sell),
  };
}

export async function getHiveEngineTradeHistory<T = Record<string, unknown>>(
  symbol: string,
  limit: number = 50
): Promise<T[]> {
  return engineRpcSafe<T[]>(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "market",
        table: "tradesHistory",
        query: { symbol },
        limit,
        offset: 0,
        indexes: [{ index: "timestamp", descending: true }],
      },
      id: 1,
    },
    []
  );
}

export async function getHiveEngineOpenOrders<T = HiveEngineOpenOrder>(
  account: string,
  symbol: string,
  limit: number = 100
): Promise<T[]> {
  const baseParams = {
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      query: { symbol, account },
      limit,
      offset: 0,
    },
    id: 1,
  };

  const [buyRaw, sellRaw] = await Promise.all([
    engineRpcSafe<EngineOrderBookEntry[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "buyBook",
          indexes: [{ index: "timestamp", descending: true }],
        },
      },
      []
    ),
    engineRpcSafe<EngineOrderBookEntry[]>(
      {
        ...baseParams,
        params: {
          ...baseParams.params,
          table: "sellBook",
          indexes: [{ index: "timestamp", descending: true }],
        },
      },
      []
    ),
  ]);

  const formatTotal = (quantity: string, price: string) =>
    (Number(quantity || 0) * Number(price || 0)).toFixed(8);

  const buy: HiveEngineOpenOrder[] = buyRaw.map((order) => ({
    id: order.txId,
    type: "buy",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: order.tokensLocked ?? formatTotal(order.quantity, order.price),
    timestamp: Number(order.timestamp ?? 0),
  }));

  const sell: HiveEngineOpenOrder[] = sellRaw.map((order) => ({
    id: order.txId,
    type: "sell",
    account: order.account,
    symbol: order.symbol,
    quantity: order.quantity,
    price: order.price,
    total: formatTotal(order.quantity, order.price),
    timestamp: Number(order.timestamp ?? 0),
  }));

  return [...buy, ...sell].sort((a, b) => b.timestamp - a.timestamp) as T[];
}

/**
 * Market metrics, optionally narrowed to one symbol or to a list of them.
 *
 * An unfiltered call is served from a single page – the node caps `find` at 1000 rows
 * while Hive engine has far more traded tokens than that – so callers that only care
 * about specific symbols must pass them. Scanning the unfiltered page for a symbol
 * silently reports "no market" for everything outside it.
 */
export async function getHiveEngineMetrics<T = Record<string, unknown>>(
  symbol?: string | string[],
  account?: string
): Promise<T[]> {
  if (Array.isArray(symbol) && symbol.length === 0) {
    return [];
  }

  const symbolQuery = Array.isArray(symbol)
    ? { symbol: { $in: symbol } }
    : symbol
      ? { symbol }
      : {};

  return engineRpcSafe<T[]>(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "market",
        table: "metrics",
        query: {
          ...symbolQuery,
          ...(account ? { account } : {}),
        },
      },
      id: 1,
    },
    []
  );
}

export async function getHiveEngineTokensMarket<T = Record<string, unknown>>(
  account?: string,
  symbol?: string | string[]
): Promise<T[]> {
  return getHiveEngineMetrics<T>(symbol, account);
}

export async function getHiveEngineTokensBalances<T = Record<string, unknown>>(
  username: string
): Promise<T[]> {
  return engineRpcSafe<T[]>(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "tokens",
        table: "balances",
        query: {
          account: username,
        },
      },
      id: 1,
    },
    []
  );
}

export async function getHiveEngineTokensMetadata<T = Record<string, unknown>>(
  tokens: string[]
): Promise<T[]> {
  return engineRpcSafe<T[]>(
    {
      jsonrpc: "2.0",
      method: "find",
      params: {
        contract: "tokens",
        table: "tokens",
        query: {
          symbol: { $in: tokens },
        },
      },
      id: 2,
    },
    []
  );
}

export async function getHiveEngineTokenTransactions<T = Record<string, unknown>>(
  username: string,
  symbol: string,
  limit: number,
  offset: number
): Promise<T[]> {
  const fetchApi = getBoundFetch();
  const baseUrl = ConfigManager.getValidatedBaseUrl();
  const url = new URL("/private-api/engine-account-history", baseUrl);
  url.searchParams.set("account", username);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());

  const response = await fetchApi(url.toString(), {
    method: "GET",
    headers: { "Content-type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] – account history failed with ${response.status}`
    );
  }

  return (await response.json()) as T[];
}

export async function getHiveEngineTokenMetrics<T = Record<string, unknown>>(
  symbol: string,
  interval = "daily"
): Promise<T[]> {
  const fetchApi = getBoundFetch();
  const baseUrl = ConfigManager.getValidatedBaseUrl();
  const url = new URL("/private-api/engine-chart-api", baseUrl);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);

  const response = await fetchApi(url.toString(), {
    headers: { "Content-type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] – chart failed with ${response.status}`
    );
  }

  return (await response.json()) as T[];
}

export async function getHiveEngineUnclaimedRewards<T = Record<string, unknown>>(
  username: string
): Promise<Record<string, T>> {
  const fetchApi = getBoundFetch();
  const baseUrl = ConfigManager.getValidatedBaseUrl();
  const response = await fetchApi(
    `${baseUrl}/private-api/engine-reward-api/${username}?hive=1`
  );

  if (!response.ok) {
    throw new Error(
      `[SDK][HiveEngine] – rewards failed with ${response.status}`
    );
  }

  return (await response.json()) as Record<string, T>;
}
