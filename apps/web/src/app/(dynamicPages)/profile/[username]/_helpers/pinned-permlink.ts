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

/**
 * Every identity under which a card can render this entry.
 *
 * A cross-post is a separate on-chain post (`<original-permlink>-hive-NNNNNN`)
 * whose body is a wrapper, and `EntryListItemComponent` renders the post it
 * wraps, not the wrapper:
 *
 *   const entry = entryProp.original_entry || entryProp;
 *   ... id={`${entry.author}-${entry.permlink}`}
 *
 * So `@alice/x-hive-1` and `@alice/x` are ONE card on screen, with one id and
 * one title. Comparing raw permlinks therefore misses the case the pinned
 * dedupe exists for: on /@m16uellop the pinned post `haciendo-anillo-...`
 * rendered as the pinned card AND again from the feed's cross-post
 * `haciendo-anillo-...-hive-148441`, whose card carries the pinned post's own
 * id (#1807).
 *
 * The SDK attaches `original_entry` in `resolvePost()` (bridge/requests.ts) for
 * anything tagged `cross-post` with `original_author`/`original_permlink`, so
 * feed entries carry it. `getPostQueryOptions` — the pinned entry's own fetch —
 * does NOT resolve, which is why the pinned side contributes its raw identity
 * too and both sides are compared as SETS rather than single values.
 *
 * Names and permlinks are lowercase by protocol, but the pinned permlink is
 * user-written JSON: normalising costs nothing and no two distinct Hive posts
 * differ only by case.
 */
type IdentifiableEntry = {
  author?: unknown;
  permlink?: unknown;
  original_entry?: { author?: unknown; permlink?: unknown } | null;
};

export function entryIdentityKeys(entry: IdentifiableEntry | null | undefined): string[] {
  const keys: string[] = [];
  const add = (author: unknown, permlink: unknown) => {
    if (typeof author !== "string" || typeof permlink !== "string") return;
    const a = author.trim().toLowerCase();
    const p = permlink.trim().toLowerCase();
    if (!a || !p) return;
    const key = `${a}/${p}`;
    if (!keys.includes(key)) keys.push(key);
  };

  add(entry?.author, entry?.permlink);
  add(entry?.original_entry?.author, entry?.original_entry?.permlink);

  return keys;
}

/**
 * The identity set of the post the pinned card is showing, or [] when no pinned
 * card is being rendered.
 *
 * `pinnedEntry` is the gate on purpose. The old filter dropped the pinned
 * permlink from the feed whether or not the pinned card existed, so a profile
 * whose pinned entry failed to prefetch lost that post from the list entirely:
 * no pinned card, no feed row. Nothing is filtered unless something is shown in
 * its place.
 */
export function pinnedIdentityKeys(
  accountName: string | undefined,
  pinned: string | undefined,
  pinnedEntry: IdentifiableEntry | null | undefined
): string[] {
  if (!pinnedEntry) return [];

  const keys = entryIdentityKeys(pinnedEntry);
  // The permlink as the profile metadata spells it, under the profile's own
  // account: the fetched entry answers for itself, this answers for what was
  // asked for.
  for (const key of entryIdentityKeys({ author: accountName, permlink: pinned })) {
    if (!keys.includes(key)) keys.push(key);
  }

  return keys;
}

/** True when this feed entry is the same post the pinned card already shows. */
export function isPinnedDuplicate(
  entry: IdentifiableEntry | null | undefined,
  pinnedKeys: readonly string[]
): boolean {
  if (pinnedKeys.length === 0) return false;
  return entryIdentityKeys(entry).some((key) => pinnedKeys.includes(key));
}
