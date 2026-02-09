import { Operation } from "@hiveio/dhive";

/**
 * Market Operations
 * Operations for trading on the internal Hive market
 */

/**
 * Transaction type for buy/sell operations
 */
export enum BuySellTransactionType {
  Buy = "buy",
  Sell = "sell",
}

/**
 * Order ID prefix for different order types
 */
export enum OrderIdPrefix {
  EMPTY = "",
  SWAP = "9",
}

/**
 * Builds a limit order create operation.
 * @param owner - Account creating the order
 * @param amountToSell - Amount and asset to sell
 * @param minToReceive - Minimum amount and asset to receive
 * @param fillOrKill - If true, order must be filled immediately or cancelled
 * @param expiration - Expiration date (ISO string)
 * @param orderId - Unique order ID
 * @returns Limit order create operation
 */
export function buildLimitOrderCreateOp(
  owner: string,
  amountToSell: string,
  minToReceive: string,
  fillOrKill: boolean,
  expiration: string,
  orderId: number
): Operation {
  if (!owner || !amountToSell || !minToReceive || !expiration || orderId === undefined) {
    throw new Error("[SDK][buildLimitOrderCreateOp] Missing required parameters");
  }

  return [
    "limit_order_create",
    {
      owner,
      orderid: orderId,
      amount_to_sell: amountToSell,
      min_to_receive: minToReceive,
      fill_or_kill: fillOrKill,
      expiration,
    },
  ];
}

/**
 * Helper to format number to 3 decimal places
 */
function formatNumber(value: number, decimals: number = 3): string {
  return value.toFixed(decimals);
}

/**
 * Builds a limit order create operation with automatic formatting.
 * This is a convenience method that handles buy/sell logic and formatting.
 *
 * For Buy orders: You're buying HIVE with HBD
 *   - amountToSell: HBD amount you're spending
 *   - minToReceive: HIVE amount you want to receive
 *
 * For Sell orders: You're selling HIVE for HBD
 *   - amountToSell: HIVE amount you're selling
 *   - minToReceive: HBD amount you want to receive
 *
 * @param owner - Account creating the order
 * @param amountToSell - Amount to sell (number)
 * @param minToReceive - Minimum to receive (number)
 * @param orderType - Buy or Sell
 * @param idPrefix - Order ID prefix
 * @returns Limit order create operation
 */
export function buildLimitOrderCreateOpWithType(
  owner: string,
  amountToSell: number,
  minToReceive: number,
  orderType: BuySellTransactionType,
  idPrefix: OrderIdPrefix = OrderIdPrefix.EMPTY
): Operation {
  // Validate numeric inputs
  if (
    !owner ||
    orderType === undefined ||
    !Number.isFinite(amountToSell) ||
    amountToSell <= 0 ||
    !Number.isFinite(minToReceive) ||
    minToReceive <= 0
  ) {
    throw new Error("[SDK][buildLimitOrderCreateOpWithType] Missing or invalid parameters");
  }

  // Calculate expiration (27 days from now)
  const expiration = new Date(Date.now());
  expiration.setDate(expiration.getDate() + 27);
  const expirationStr = expiration.toISOString().split(".")[0];

  // Generate order ID
  const orderId = Number(
    `${idPrefix}${Math.floor(Date.now() / 1000)
      .toString()
      .slice(2)}`
  );

  // Format amounts based on order type
  // Buy: Sell HBD to buy HIVE
  // Sell: Sell HIVE to buy HBD
  const formattedAmountToSell =
    orderType === BuySellTransactionType.Buy
      ? `${formatNumber(amountToSell, 3)} HBD`
      : `${formatNumber(amountToSell, 3)} HIVE`;

  const formattedMinToReceive =
    orderType === BuySellTransactionType.Buy
      ? `${formatNumber(minToReceive, 3)} HIVE`
      : `${formatNumber(minToReceive, 3)} HBD`;

  return buildLimitOrderCreateOp(
    owner,
    formattedAmountToSell,
    formattedMinToReceive,
    false,
    expirationStr,
    orderId
  );
}

/**
 * Builds a limit order cancel operation.
 * @param owner - Account cancelling the order
 * @param orderId - Order ID to cancel
 * @returns Limit order cancel operation
 */
export function buildLimitOrderCancelOp(owner: string, orderId: number): Operation {
  if (!owner || orderId === undefined) {
    throw new Error("[SDK][buildLimitOrderCancelOp] Missing required parameters");
  }

  return [
    "limit_order_cancel",
    {
      owner,
      orderid: orderId,
    },
  ];
}

/**
 * Builds a claim reward balance operation.
 * @param account - Account claiming rewards
 * @param rewardHive - HIVE reward to claim (e.g., "0.000 HIVE")
 * @param rewardHbd - HBD reward to claim (e.g., "0.000 HBD")
 * @param rewardVests - VESTS reward to claim (e.g., "0.000000 VESTS")
 * @returns Claim reward balance operation
 */
export function buildClaimRewardBalanceOp(
  account: string,
  rewardHive: string,
  rewardHbd: string,
  rewardVests: string
): Operation {
  if (!account || !rewardHive || !rewardHbd || !rewardVests) {
    throw new Error("[SDK][buildClaimRewardBalanceOp] Missing required parameters");
  }

  return [
    "claim_reward_balance",
    {
      account,
      reward_hive: rewardHive,
      reward_hbd: rewardHbd,
      reward_vests: rewardVests,
    },
  ];
}
