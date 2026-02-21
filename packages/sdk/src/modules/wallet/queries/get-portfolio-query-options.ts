import { CONFIG, ConfigManager } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

type PortfolioLayer = "points" | "hive" | "chain" | "spk" | "engine";

interface TokenAction {
  id: string;
  [key: string]: unknown;
}

export interface PortfolioWalletItem {
  name: string;
  symbol: string;
  layer: PortfolioLayer;
  balance: number;
  fiatRate: number;
  currency: string;
  precision: number;
  address?: string;
  error?: string;
  pendingRewards?: number;
  pendingRewardsFiat?: number;
  liquid?: number;
  liquidFiat?: number;
  savings?: number;
  savingsFiat?: number;
  staked?: number;
  stakedFiat?: number;
  iconUrl?: string;
  actions?: TokenAction[];
  extraData?: Array<{ dataKey: string; value: any }>;
  apr?: number;
}

export interface PortfolioResponse {
  username: string;
  currency?: string;
  wallets: PortfolioWalletItem[];
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const direct = Number.parseFloat(trimmed);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const sanitized = trimmed.replace(/,/g, "");
    const match = sanitized.match(/[-+]?\d+(?:\.\d+)?/);
    if (match) {
      const parsed = Number.parseFloat(match[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function parseToken(rawToken: unknown): PortfolioWalletItem | undefined {
  if (!rawToken || typeof rawToken !== "object") {
    return undefined;
  }

  const token = rawToken as Record<string, unknown>;

  // Portfolio v2 returns well-defined PortfolioItem structure
  return {
    name: normalizeString(token.name) ?? "",
    symbol: normalizeString(token.symbol) ?? "",
    layer: (normalizeString(token.layer) ?? "hive") as PortfolioLayer,
    balance: normalizeNumber(token.balance) ?? 0,
    fiatRate: normalizeNumber(token.fiatRate) ?? 0,
    currency: normalizeString(token.currency) ?? "usd",
    precision: normalizeNumber(token.precision) ?? 3,
    address: normalizeString(token.address),
    error: normalizeString(token.error),
    pendingRewards: normalizeNumber(token.pendingRewards),
    pendingRewardsFiat: normalizeNumber(token.pendingRewardsFiat),
    liquid: normalizeNumber(token.liquid),
    liquidFiat: normalizeNumber(token.liquidFiat),
    savings: normalizeNumber(token.savings),
    savingsFiat: normalizeNumber(token.savingsFiat),
    staked: normalizeNumber(token.staked),
    stakedFiat: normalizeNumber(token.stakedFiat),
    iconUrl: normalizeString(token.iconUrl),
    actions: (token.actions ?? []) as TokenAction[],
    extraData: (token.extraData ?? []) as Array<{ dataKey: string; value: any }>,
    apr: normalizeNumber(token.apr),
  };
}

function extractTokens(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const containers = [payload];
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    containers.push(record.data as Record<string, unknown>);
  }
  if (record.result && typeof record.result === "object") {
    containers.push(record.result as Record<string, unknown>);
  }
  if (record.portfolio && typeof record.portfolio === "object") {
    containers.push(record.portfolio as Record<string, unknown>);
  }

  for (const container of containers) {
    if (Array.isArray(container)) {
      return container;
    }

    if (container && typeof container === "object") {
      for (const key of [
        "wallets",
        "tokens",
        "assets",
        "items",
        "portfolio",
        "balances",
      ]) {
        const value = (container as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          return value;
        }
      }
    }
  }

  return [];
}

function resolveUsername(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  return (
    normalizeString(record.username) ??
    normalizeString(record.name) ??
    normalizeString(record.account)
  );
}

/**
 * Get portfolio query options for fetching user's wallet balances across all layers
 * @param username - Hive username
 * @param currency - Fiat currency code (default: "usd")
 * @param onlyEnabled - Only return enabled tokens (default: true)
 * @returns TanStack Query options for portfolio data
 */
export function getPortfolioQueryOptions(
  username: string,
  currency: string = "usd",
  onlyEnabled: boolean = true
) {
  return queryOptions({
    queryKey: [
      "wallet",
      "portfolio",
      "v2",
      username,
      onlyEnabled ? "only-enabled" : "all",
      currency,
    ],
    enabled: Boolean(username),
    staleTime: 60000,
    refetchInterval: 120000,
    queryFn: async (): Promise<PortfolioResponse> => {
      if (!username) {
        throw new Error("[SDK][Wallet] – username is required");
      }

      if (CONFIG.privateApiHost === undefined || CONFIG.privateApiHost === null) {
        throw new Error(
          "[SDK][Wallet] – privateApiHost isn't configured for portfolio"
        );
      }

      const endpoint = `${ConfigManager.getValidatedBaseUrl()}/wallet-api/portfolio-v2`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, onlyEnabled, currency }),
      });

      if (!response.ok) {
        throw new Error(
          `[SDK][Wallet] – Portfolio request failed (${response.status})`
        );
      }

      const payload = (await response.json()) as unknown;
      const tokens = extractTokens(payload)
        .map((item) => parseToken(item))
        .filter((item): item is PortfolioWalletItem => Boolean(item));

      if (!tokens.length) {
        throw new Error(
          "[SDK][Wallet] – Portfolio payload contained no tokens"
        );
      }

      return {
        username: resolveUsername(payload) ?? username,
        currency: normalizeString(
          (payload as Record<string, unknown> | undefined)?.fiatCurrency ??
          (payload as Record<string, unknown> | undefined)?.currency
        )?.toUpperCase(),
        wallets: tokens,
      };
    },
  });
}
