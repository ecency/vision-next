import { AssetOperation, type GeneralAssetInfo } from "@/modules/assets";
import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";

export interface VisionPortfolioWalletItem {
  symbol: string;
  info: GeneralAssetInfo;
  operations: AssetOperation[];
}

export interface VisionPortfolioResponse {
  username: string;
  currency?: string;
  wallets: VisionPortfolioWalletItem[];
}

const ACTION_ALIAS_MAP: Record<string, AssetOperation> = {
  "transfer-to-savings": AssetOperation.TransferToSavings,
  "transfer-savings": AssetOperation.TransferToSavings,
  "savings-transfer": AssetOperation.TransferToSavings,
  "withdraw-from-savings": AssetOperation.WithdrawFromSavings,
  "withdraw-savings": AssetOperation.WithdrawFromSavings,
  "savings-withdraw": AssetOperation.WithdrawFromSavings,
  "powerup": AssetOperation.PowerUp,
  "power-down": AssetOperation.PowerDown,
  "powerdown": AssetOperation.PowerDown,
  "hp-delegate": AssetOperation.Delegate,
  "delegate-hp": AssetOperation.Delegate,
  "delegate-power": AssetOperation.Delegate,
  "undelegate-power": AssetOperation.Undelegate,
  "undelegate-token": AssetOperation.Undelegate,
  "stake-token": AssetOperation.Stake,
  "stake-power": AssetOperation.Stake,
  "unstake-token": AssetOperation.Unstake,
  "unstake-power": AssetOperation.Unstake,
  "lock-liquidity": AssetOperation.LockLiquidity,
  "lock-liq": AssetOperation.LockLiquidity,
  "gift-points": AssetOperation.Gift,
  "points-gift": AssetOperation.Gift,
  "promote-post": AssetOperation.Promote,
  "promote-entry": AssetOperation.Promote,
  "claim-points": AssetOperation.Claim,
  "claim-rewards": AssetOperation.Claim,
  "buy-points": AssetOperation.Buy,
  "swap-token": AssetOperation.Swap,
  "swap-tokens": AssetOperation.Swap,
  "withdraw-routes": AssetOperation.WithdrawRoutes,
  "withdrawroutes": AssetOperation.WithdrawRoutes,
  "claim-interest": AssetOperation.ClaimInterest,
};

const KNOWN_OPERATION_VALUES = new Map<string, AssetOperation>(
  Object.values(AssetOperation).map((value) => [value, value])
);

const DERIVED_PART_KEY_MAP: Record<string, string[]> = {
  liquid: ["liquid", "liquidBalance", "liquid_amount", "liquidTokens"],
  savings: ["savings", "savingsBalance", "savings_amount"],
  staked: ["staked", "stakedBalance", "staking", "stake", "power"],
  delegated: ["delegated", "delegatedBalance", "delegationsOut"],
  received: ["received", "receivedBalance", "delegationsIn"],
  pending: [
    "pending",
    "pendingRewards",
    "unclaimed",
    "unclaimedBalance",
    "pendingReward",
  ],
};

const EXTRA_DATA_PART_KEY_MAP: Record<string, string> = {
  delegated: "outgoing_delegations",
  outgoing: "outgoing_delegations",
  delegations_out: "outgoing_delegations",
  delegated_hive_power: "outgoing_delegations",
  delegated_hp: "outgoing_delegations",
  received: "incoming_delegations",
  incoming: "incoming_delegations",
  delegations_in: "incoming_delegations",
  received_hive_power: "incoming_delegations",
  received_hp: "incoming_delegations",
  powering_down: "pending_power_down",
  power_down: "pending_power_down",
  powering_down_hive_power: "pending_power_down",
};

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

function normalizeParts(
  rawParts: unknown
): GeneralAssetInfo["parts"] | undefined {
  if (Array.isArray(rawParts)) {
    const parsed = rawParts
      .map((item) => {
        if (!item || typeof item !== "object") {
          return undefined;
        }

        const name = normalizeString(
          (item as Record<string, unknown>).name ??
            (item as Record<string, unknown>).label ??
            (item as Record<string, unknown>).type ??
            (item as Record<string, unknown>).part
        );
        const balance = normalizeNumber(
          (item as Record<string, unknown>).balance ??
            (item as Record<string, unknown>).amount ??
            (item as Record<string, unknown>).value
        );

        if (!name || balance === undefined) {
          return undefined;
        }

        return { name, balance };
      })
      .filter((item): item is { name: string; balance: number } => Boolean(item));

    return parsed.length ? parsed : undefined;
  }

  if (rawParts && typeof rawParts === "object") {
    const parsed = Object.entries(rawParts as Record<string, unknown>)
      .map(([name, amount]) => {
        const balance = normalizeNumber(amount);
        if (!name || balance === undefined) {
          return undefined;
        }

        return { name, balance };
      })
      .filter((item): item is { name: string; balance: number } => Boolean(item));

    return parsed.length ? parsed : undefined;
  }

  return undefined;
}

function deriveParts(record: Record<string, unknown>) {
  const derived = Object.entries(DERIVED_PART_KEY_MAP)
    .map(([name, keys]) => {
      for (const key of keys) {
        const value = normalizeNumber(record[key]);
        if (value !== undefined) {
          return { name, balance: value };
        }
      }

      return undefined;
    })
    .filter((item): item is { name: string; balance: number } => Boolean(item));

  return derived.length ? derived : undefined;
}

function normalizePartKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function mergeParts(
  ...sources: (GeneralAssetInfo["parts"] | undefined)[]
): GeneralAssetInfo["parts"] | undefined {
  const order: string[] = [];
  const values = new Map<string, number>();

  for (const parts of sources) {
    if (!parts) {
      continue;
    }

    for (const part of parts) {
      if (!part?.name || typeof part.balance !== "number") {
        continue;
      }

      const existing = values.get(part.name);
      if (existing === undefined) {
        order.push(part.name);
        values.set(part.name, part.balance);
      } else {
        values.set(part.name, existing + part.balance);
      }
    }
  }

  return order.length
    ? order.map((name) => ({ name, balance: values.get(name)! }))
    : undefined;
}

function normalizeExtraDataParts(
  rawExtraData: unknown
): GeneralAssetInfo["parts"] | undefined {
  const items = Array.isArray(rawExtraData)
    ? rawExtraData
    : rawExtraData && typeof rawExtraData === "object"
      ? Object.values(rawExtraData as Record<string, unknown>)
      : [];

  const parts = items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return undefined;
      }

      const record = item as Record<string, unknown>;
      const keyCandidate =
        normalizeString(record.dataKey) ??
        normalizeString(record.key) ??
        normalizeString(record.name);

      if (!keyCandidate) {
        return undefined;
      }

      const canonical = normalizePartKey(keyCandidate);
      const partName = EXTRA_DATA_PART_KEY_MAP[canonical];

      if (!partName) {
        return undefined;
      }

      const balance = normalizeNumber(
        record.balance ??
          record.amount ??
          record.value ??
          record.displayValue ??
          record.text
      );

      if (balance === undefined) {
        return undefined;
      }

      return { name: partName, balance: Math.abs(balance) };
    })
    .filter((part): part is { name: string; balance: number } => Boolean(part));

  return parts.length ? parts : undefined;
}

function normalizeActionKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

function mapActions(rawActions: unknown): AssetOperation[] {
  if (!rawActions) {
    return [];
  }

  const rawList = Array.isArray(rawActions) ? rawActions : [rawActions];
  const result: AssetOperation[] = [];

  for (const raw of rawList) {
    let candidate: string | undefined;
    if (typeof raw === "string") {
      candidate = raw;
    } else if (raw && typeof raw === "object") {
      const record = raw as Record<string, unknown>;
      candidate =
        normalizeString(record.code) ??
        normalizeString(record.name) ??
        normalizeString(record.action);
    }

    if (!candidate) {
      continue;
    }

    const canonical = normalizeActionKey(candidate);
    const operation =
      KNOWN_OPERATION_VALUES.get(canonical) ?? ACTION_ALIAS_MAP[canonical];

    if (operation && !result.includes(operation)) {
      result.push(operation);
    }
  }

  return result;
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
  const price =
    normalizeNumber(token.fiatRate) ??
    normalizeNumber(token.price) ??
    normalizeNumber(token.priceUsd) ??
    normalizeNumber(token.usdPrice) ??
    normalizeNumber((token.metrics as Record<string, unknown> | undefined)?.price) ??
    normalizeNumber(
      (token.metrics as Record<string, unknown> | undefined)?.priceUsd
    ) ??
    0;
  const apr =
    normalizeApr(token.apr) ??
    normalizeApr(token.aprPercent) ??
    normalizeApr((token.metrics as Record<string, unknown> | undefined)?.apr) ??
    normalizeApr(
      (token.metrics as Record<string, unknown> | undefined)?.aprPercent
    );
  const baseParts =
    normalizeParts(
      token.parts ??
        token.balances ??
        token.sections ??
        token.breakdown ??
        token.accountBreakdown ??
        token.walletParts
    ) ?? deriveParts(token);
  const parts = mergeParts(
    baseParts,
    normalizeExtraDataParts(
      (token.extraData ?? token.extra_data ?? token.extra ?? token.badges) as
        | Record<string, unknown>
        | unknown[]
        | undefined
    )
  );
  const accountBalance =
    normalizeNumber(token.balance) ??
    normalizeNumber(token.accountBalance) ??
    normalizeNumber(token.totalBalance) ??
    normalizeNumber(token.total) ??
    normalizeNumber(token.amount) ??
    (baseParts
      ? baseParts.reduce((total, part) => total + (part.balance ?? 0), 0)
      : parts
        ? parts.reduce((total, part) => total + (part.balance ?? 0), 0)
        : 0);
  const layer =
    normalizeString(token.layer) ??
    normalizeString(token.chain) ??
    normalizeString(token.category) ??
    normalizeString(token.type);

  return {
    symbol: normalizedSymbol,
    info: {
      name: normalizedSymbol,
      title,
      price,
      accountBalance,
      apr: apr ?? undefined,
      layer: layer ?? undefined,
      parts,
    },
    operations: mapActions(
      token.actions ??
        token.available_actions ??
        token.availableActions ??
        token.operations ??
        token.supportedActions
    ),
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

export function getVisionPortfolioQueryOptions(username: string) {
  return queryOptions({
    queryKey: [
      "ecency-wallets",
      "portfolio",
      "v2",
      username,
      "only-enabled",
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
        body: JSON.stringify({ username, onlyEnabled: true }),
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
          (payload as Record<string, unknown> | undefined)?.currency
        )?.toUpperCase(),
        wallets: tokens,
      };
    },
  });
}
