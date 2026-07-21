interface EngineBalance {
  symbol: string;
  balance: string;
}

interface EngineMetric {
  symbol: string;
  lastPrice: string;
}

/**
 * Sums the USD value of a Hive engine wallet.
 *
 * A held token is not guaranteed to have a market metrics entry (it may have never traded),
 * so its price has to fall back to zero – multiplying by a missing price turned the whole
 * total into NaN and the balance column rendered "$NaN".
 */
export function calculateEngineTokensUsdValue(
  balances: EngineBalance[],
  metrics: EngineMetric[],
  pricePerHive: number
) {
  if (!Number.isFinite(pricePerHive)) {
    return 0;
  }

  return balances.reduce((total, item) => {
    const balance = Number(item.balance);
    if (!Number.isFinite(balance)) {
      return total;
    }

    if (item.symbol === "SWAP.HIVE") {
      return total + pricePerHive * balance;
    }

    const lastPrice = Number(metrics.find((m) => m.symbol === item.symbol)?.lastPrice ?? 0);
    if (!Number.isFinite(lastPrice) || lastPrice === 0) {
      return total;
    }

    return total + lastPrice * pricePerHive * balance;
  }, 0);
}
