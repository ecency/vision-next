// Dependency-free Pro constants + membership helpers. Kept free of React/Stripe imports so
// the badge (rendered above the fold on profiles) and the perks card can use them without
// pulling in the checkout bundle.

/** The ePoints Stripe SKU for Ecency Pro (leading number = price in cents). */
export const PRO_SKU = "1999pro";

/** Yearly Pro price in USD. */
export const PRO_PRICE_USD = 19.99;

/** Lowercased set of member usernames for O(1), case-insensitive membership checks. */
export function proMembersSet(members?: string[]): Set<string> {
  return new Set((members ?? []).map((m) => m.toLowerCase()));
}

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
