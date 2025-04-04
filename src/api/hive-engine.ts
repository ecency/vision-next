import { HiveEngineToken } from "@/utils";
import { TransactionConfirmation } from "@hiveio/dhive";
import { broadcastPostingJSON } from "./operations";
import engine from "@/engine.json";
import { apiBase } from "./helper";
import { Token, TokenBalance, TokenMetadata, TokenStatus } from "@/entities";
import { appAxios } from "@/api/axios";

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

  return appAxios
    .post(apiBase(engine.API), data, {
      headers: { "Content-type": "application/json" }
    })
    .then((r) => r.data.result)
    .catch((e) => {
      return [];
    });
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

  return appAxios
    .post(apiBase(engine.API), data, {
      headers: { "Content-type": "application/json" }
    })
    .then((r) => r.data.result)
    .catch((e) => {
      return [];
    });
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

export const stakeTokens = async (
  account: string,
  token: string,
  amount: string
): Promise<TransactionConfirmation> => {
  const json = JSON.stringify({
    contractName: "tokens",
    contractAction: "stake",
    contractPayload: {
      symbol: token,
      to: account,
      quantity: amount
    }
  });

  return broadcastPostingJSON(account, "ssc-mainnet-hive", json);
};

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
