/**
 * Derive the claim target from a hostname. A `hive-<digits>` label reads as a community, anything
 * else as an author blog. Pure and dependency-free so it can be unit-tested without pulling in the
 * runtime config/i18n. "hive-125126.blogs.ecency.com" -> { name: "hive-125126", isCommunity: true }.
 *
 * Hive account names may contain dots, so the tenant is not always a single DNS label:
 * "alice.dev.blogs.ecency.com" is the tenant "alice.dev", not "alice". The name is taken by
 * stripping the managed base domain rather than by splitting on the first dot, so the claim CTA
 * deep-links to the account the visitor actually asked for.
 */
const MANAGED_BASE_SUFFIX = ".blogs.ecency.com";

export function parseClaimTarget(host: string): { name: string; isCommunity: boolean } {
  // Strip a port and a trailing DNS root dot: a rooted host ("…ecency.com.") is a valid
  // FQDN a browser can hand us in location.hostname, and it would otherwise miss the
  // suffix check and fall back to the first label. nginx does this normalisation itself
  // server-side, so only this client-side parse needs it.
  const normalized = (host || "")
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  const name = normalized.endsWith(MANAGED_BASE_SUFFIX)
    ? normalized.slice(0, -MANAGED_BASE_SUFFIX.length)
    : // Custom domains and local development have no managed suffix to strip; fall back to the
      // first label so behaviour off the managed base domain is unchanged.
      normalized.split(".")[0] || normalized;
  return { name, isCommunity: /^hive-\d+$/i.test(name) };
}
