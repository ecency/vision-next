/**
 * Re-export SDK portfolio query for backwards compatibility
 * This maintains the wallets package API while using SDK implementation
 */
import { getPortfolioQueryOptions, PortfolioWalletItem, PortfolioResponse } from "@ecency/sdk";

// Type aliases for backwards compatibility
export type VisionPortfolioWalletItem = PortfolioWalletItem;
export type VisionPortfolioResponse = PortfolioResponse;

/**
 * @deprecated Use getPortfolioQueryOptions from @ecency/sdk instead
 * This wrapper is maintained for backwards compatibility
 */
export function getVisionPortfolioQueryOptions(username: string, currency: string = "usd") {
  // Use SDK version with onlyEnabled: true (previous default behavior)
  return getPortfolioQueryOptions(username, currency, true);
}
