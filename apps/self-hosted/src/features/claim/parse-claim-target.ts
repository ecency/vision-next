/**
 * Derive the claim target from a hostname. A `hive-<digits>` label reads as a community, anything
 * else as an author blog. Pure and dependency-free so it can be unit-tested without pulling in the
 * runtime config/i18n. "hive-125126.blogs.ecency.com" -> { name: "hive-125126", isCommunity: true }.
 */
export function parseClaimTarget(host: string): { name: string; isCommunity: boolean } {
  const label = (host || "").split(".")[0] || host || "";
  return { name: label, isCommunity: /^hive-\d+$/i.test(label) };
}
