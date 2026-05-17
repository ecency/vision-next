import { Entry } from "@/entities";
import defaults from "@/defaults";
import { canonicalTarget } from "@/utils/entry-indexability";

/**
 * Returns the canonical URL for an entry, or null when it has no canonical
 * target (thin container post / unresolvable deep wave sub-reply) and should
 * be noindexed instead.
 *
 * Thin wrapper over canonicalTarget — the single source of truth shared with
 * the indexability decision so canonical and noindex can never disagree.
 * See entry-indexability.ts for the full model (self-canonical posts,
 * reply -> discussion root, wave/snap container handling).
 */
export function entryCanonical(entry: Entry, baseUrl = defaults.base): string | null {
  return canonicalTarget(entry, baseUrl);
}
