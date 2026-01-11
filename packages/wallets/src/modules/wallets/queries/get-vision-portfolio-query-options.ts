import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";

export interface VisionPortfolioWalletItem {
  symbol: string;
  name: string;
  title?: string;
  price?: number;
  accountBalance?: number;
  apr?: number;
  layer?: string;
  pendingRewards?: number;
  savings?: number;
  actions?: Array<{ id: string; [key: string]: unknown } | string>;
  fiatRate?: number;
  fiatCurrency?: string;
}

export interface VisionPortfolioResponse {
  username: string;
  currency?: string;
  wallets: VisionPortfolioWalletItem[];
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

function normalizeApr(value: unknown): string | undefined {
  const numeric = normalizeNumber(value);

  if (numeric === undefined) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  }

  return numeric.toString();
}

function parseToken(rawToken: unknown): VisionPortfolioWalletItem | undefined {
  if (!rawToken || typeof rawToken !== "object") {
    return undefined;
  }

  const token = rawToken as Record<string, unknown>;
  const symbol =
    normalizeString(token.symbol) ??
    normalizeString(token.asset) ??
    normalizeString(token.name);

  if (!symbol) {
    return undefined;
  }

  const normalizedSymbol = symbol.toUpperCase();
  const title =
    normalizeString(token.title) ??
    normalizeString(token.display) ??
    normalizeString(token.label) ??
    normalizeString(token.friendlyName) ??
    normalizeString(token.name) ??
    normalizedSymbol;
  const price = normalizeNumber(token.fiatRate) ?? 0;
  const apr =
    normalizeApr(token.apr) ??
    normalizeApr(token.aprPercent) ??
    normalizeApr((token.metrics as Record<string, unknown> | undefined)?.apr) ??
    normalizeApr(
      (token.metrics as Record<string, unknown> | undefined)?.aprPercent
    );
  const accountBalance =
    normalizeNumber(token.balance) ??
    normalizeNumber(token.accountBalance) ??
    normalizeNumber(token.totalBalance) ??
    normalizeNumber(token.total) ??
    normalizeNumber(token.amount) ??
    0;
  const layer =
    normalizeString(token.layer) ??
    normalizeString(token.chain) ??
    normalizeString(token.category) ??
    normalizeString(token.type);
  const pendingRewards = normalizeNumber(token.pendingRewards);
  const savings = normalizeNumber(token.savings);

  return {
    symbol: normalizedSymbol,
    name: normalizedSymbol,
    title,
    price,
    accountBalance,
    apr: apr ? Number.parseFloat(apr) : undefined,
    layer: layer ?? undefined,
    pendingRewards: pendingRewards ?? undefined,
    savings: savings ?? undefined,
    actions: (token.actions ??
      token.available_actions ??
      token.availableActions ??
      token.operations ??
      token.supportedActions) as VisionPortfolioWalletItem["actions"],
    fiatRate: normalizeNumber(token.fiatRate) ?? undefined,
    fiatCurrency: normalizeString(token.fiatCurrency) ?? undefined,
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

export function getVisionPortfolioQueryOptions(username: string, currency: string = "usd") {
  return queryOptions({
    queryKey: [
      "ecency-wallets",
      "portfolio",
      "v2",
      username,
      "only-enabled",
      currency,
    ],
    enabled: Boolean(username),
    staleTime: 60000,
    refetchInterval: 120000,
    queryFn: async (): Promise<VisionPortfolioResponse> => {
      if (!username) {
        throw new Error("[SDK][Wallets] – username is required");
      }

      if (!CONFIG.privateApiHost) {
        throw new Error(
          "[SDK][Wallets] – privateApiHost isn't configured for portfolio"
        );
      }

      const endpoint = `${CONFIG.privateApiHost}/wallet-api/portfolio-v2`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, onlyEnabled: true, currency }),
      });

      if (!response.ok) {
        throw new Error(
          `[SDK][Wallets] – Vision portfolio request failed(${response.status})`
        );
      }

      const payload = (await response.json()) as unknown;
      const tokens = extractTokens(payload)
        .map((item) => parseToken(item))
        .filter((item): item is VisionPortfolioWalletItem => Boolean(item));

      if (!tokens.length) {
        throw new Error(
          "[SDK][Wallets] – Vision portfolio payload contained no tokens"
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
