import type { Spotlight } from "@ecency/sdk";

export type SpotlightPlatform = "web" | "mobile";

function pathMatches(pathname: string | null, pattern: string): boolean {
  try {
    return !!pathname?.match(pattern);
  } catch {
    // A malformed regex from the API must skip that spotlight, not crash the chain.
    return false;
  }
}

/**
 * Pick the single spotlight to show. The server already filtered by the date window;
 * here we apply the client-side rules — platform (website vs mobile app), audience
 * (logged-in by default, or guestsOnly for signed-out visitors), path regex, and per-id
 * dismissal — then pick the highest weight
 * (tie-break: earliest start). Pure + exported for unit testing.
 */
export function pickSpotlight(
  items: Spotlight[],
  activeUser: unknown,
  pathname: string | null,
  dismissed: string[],
  platform: SpotlightPlatform = "web"
): Spotlight | null {
  const candidates = items
    .filter((s) => !s.platforms || s.platforms.includes(platform))
    .filter((s) => (s.guestsOnly ? !activeUser : !!activeUser))
    .filter((s) => {
      if (!s.path) {
        return true;
      }
      if (Array.isArray(s.path)) {
        return s.path.some((p) => pathMatches(pathname, p));
      }
      return pathMatches(pathname, s.path);
    })
    .filter((s) => !dismissed.includes(s.id));

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, s) => {
    const bestWeight = best.weight ?? 0;
    const weight = s.weight ?? 0;
    if (weight !== bestWeight) {
      return weight > bestWeight ? s : best;
    }
    const bestStart = best.start ? new Date(best.start).getTime() : 0;
    const start = s.start ? new Date(s.start).getTime() : 0;
    return start < bestStart ? s : best;
  });
}
