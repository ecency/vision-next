import type { AccountProfile } from "@/entities";

/**
 * The permlink of a profile's pinned post, or undefined when the profile does
 * not carry a usable one.
 *
 * `profile.pinned` is typed `string`, but the type is a claim, not a check: the
 * SDK builds `profile` by `JSON.parse`-ing the account's `posting_json_metadata`
 * and casting the result (`parseProfileMetadata` -> `parsed.profile as
 * AccountProfile`). Anyone holding the account's posting key can write
 * `{"profile":{"pinned":123}}`, and every field below that cast arrives as
 * whatever JSON was published.
 *
 * The `typeof` test is load-bearing, not defensive noise. Every caller feeds
 * this value to `getPostQueryOptions`, which does
 *
 *   const cleanPermlink = permlink?.trim();
 *
 * while BUILDING the options object, and `permlink.trim()` again inside its
 * `enabled` expression. Optional chaining only covers null/undefined, both run
 * before any gate, and neither is inside the queryFn - so a numeric or object
 * `pinned` is a synchronous TypeError on the server, thrown by the call that
 * merely describes the query.
 *
 * While profile/[username]/loading.tsx existed, that throw happened under a
 * Suspense boundary: the shell had already flushed and only the entries region
 * failed. With the boundary gone (#1787) the same throw lands before the first
 * flush and takes the whole document, so the guard has to move to the call
 * sites.
 *
 * Deliberately NOT special-cased here: `pinned: "none"`, which some profiles
 * use as "no pinned post". Callers treat it as a permlink today (it resolves to
 * a missing post and renders nothing), and changing that is a behaviour change
 * this guard has no business making.
 */
export function pinnedPermlink(profile: AccountProfile | undefined | null): string | undefined {
  // Cast to unknown first: the declared type says `string | undefined`, and
  // that is exactly the claim being verified.
  const pinned = profile?.pinned as unknown;
  if (typeof pinned !== "string") {
    return undefined;
  }
  // "" and whitespace are not permlinks. `getPostQueryOptions` already trims
  // them to a disabled query, so dropping them here changes no behaviour and
  // saves a pointless SSR round-trip.
  return pinned.trim() === "" ? undefined : pinned;
}
