// Pro constants + a null-safe membership helper. The set-building itself lives in @ecency/sdk
// (shared with mobile) so there is a single implementation; it is re-exported here for the badge
// + perks card. No React/Stripe imports, so this stays out of the checkout bundle, and the SDK is
// already pulled in wherever the roster query is used, so importing its helper adds nothing.
import { proMembersSet } from "@ecency/sdk";

export { proMembersSet };

/** The ePoints Stripe SKU for Ecency Pro (leading number = price in cents). */
export const PRO_SKU = "1999pro";

/** Yearly Pro price in USD. */
export const PRO_PRICE_USD = 19.99;

/** Whether `username` is an active Ecency Pro member (case-insensitive). */
export function isProMember(
  members: string[] | undefined,
  username: string | null | undefined
): boolean {
  if (!username) {
    return false;
  }
  return proMembersSet(members).has(username.toLowerCase());
}
