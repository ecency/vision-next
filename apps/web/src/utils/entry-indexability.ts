import { Entry, FullAccount } from "@/entities";
import { Profile } from "@ecency/sdk";
import { postBodySummary } from "@ecency/render-helper";
import { accountReputation } from "@/utils/account-reputation";
import { isNsfwEntry } from "@/utils/nsfw-detection";
import defaults from "@/defaults";

/**
 * Single source of truth for "is this entry indexable" and "what URL should it
 * canonical to". Consumed by entry-canonical.ts and generate-entry-metadata.ts
 * so the sitemap/canonical/noindex decisions can never drift apart.
 *
 * Core principle: a comment is not its own indexable page — it canonicals to
 * the root of its discussion thread. The discussion root is the depth-0 post
 * for a normal thread, or the depth-1 wave/snap for a microblog container tree
 * (the thin depth-0 container is plumbing, never a target).
 */

// Accounts that publish thin "container" anchor posts whose depth-1 children
// are the actual short-form content (waves / snaps / threads / moments).
// hive.flow is pre-provisioned (does not exist yet — future account unifying
// waves+snaps); inert until it posts. Verify its depth-0/depth-1 shape at launch.
export const CONTAINER_ACCOUNTS = new Set<string>([
  "leothreads",
  "ecency.waves",
  "peak.snaps",
  "liketu.moments",
  "hive.flow",
]);

const NOINDEX_REPUTATION_THRESHOLD = 40;

// Wave/snap quality gate (depth-1 in a container tree). Deliberately
// conservative — index few, widen later from Search Console data.
export const WAVE_MIN_BODY_CHARS = 100; // stripped prose length
export const WAVE_MIN_CHILDREN = 3; // a real micro-thread
export const WAVE_MIN_VOTERS = 5; // beyond self + a 1-2 acct circle
export const WAVE_MIN_PAYOUT = 0.1; // dust floor (combined with voters)

// A depth-0 post BY a container account is the machine anchor only when its
// body is thin. Verified anchors are 24–119 chars; a real standalone post
// (rare, but these are not guaranteed never to publish one) is far longer.
// 400 separates them with wide margin in both directions, so anchors stay
// suppressed while a genuine post by the same account still gets indexed.
export const CONTAINER_ANCHOR_MAX_BODY = 400;

export type ReputationSource =
  | Pick<FullAccount, "reputation" | "post_count">
  | Profile
  | null;

export const shouldApplyNoIndex = (
  account: ReputationSource,
  fallbackReputation: number
): boolean => {
  const reputationScore = accountReputation(account?.reputation ?? fallbackReputation ?? 0);
  const postCount = typeof account?.post_count === "number" ? account.post_count : 0;

  const belowReputationThreshold = reputationScore < NOINDEX_REPUTATION_THRESHOLD;
  const lacksPostingHistory = postCount <= 3;

  // No-indexed when the author lacks reputation or meaningful posting history.
  return belowReputationThreshold || lacksPostingHistory;
};

type ThreadShape = Pick<
  Entry,
  | "author"
  | "permlink"
  | "depth"
  | "parent_author"
  | "parent_permlink"
  | "root_author"
  | "root_permlink"
>;

/** depth-0 author of the thread (a post is its own root). */
const rootAuthorOf = (entry: ThreadShape): string =>
  entry.root_author || entry.author;

export const isContainerTree = (entry: ThreadShape): boolean =>
  CONTAINER_ACCOUNTS.has(rootAuthorOf(entry)) ||
  // Bridge-fallback path omits root_*; for a depth-1 wave the immediate parent
  // IS the container account, so detect via parent_author too. Without this a
  // bridge-fed wave would be misread as a normal depth-1 reply and canonical
  // to the thin anchor post — strictly worse than the old self-canonical.
  (entry.depth === 1 && CONTAINER_ACCOUNTS.has(entry.parent_author ?? ""));

/** Plain-text (markdown/links/images stripped) body length. */
const plainBodyLen = (entry: Pick<Entry, "body">): number =>
  postBodySummary(entry.body || "", 1000).trim().length;

/**
 * A depth-0 post authored by a container account that is thin enough to be the
 * machine-generated anchor (not a rare real standalone post by that account).
 */
const isContainerAnchorPost = (entry: Entry): boolean =>
  (entry.depth ?? 0) === 0 &&
  isContainerTree(entry) &&
  plainBodyLen(entry) <= CONTAINER_ANCHOR_MAX_BODY;

/**
 * The canonical URL for an entry, or null when it has no canonical target and
 * should be noindexed (thin container post, or a deep wave sub-reply whose
 * depth-1 wave isn't resolvable from the entry without tree-walking).
 *
 * Honors an explicit json_metadata.canonical_url first (syndication intent).
 */
export function canonicalTarget(
  entry: Entry,
  baseUrl: string = defaults.base
): string | null {
  const declared = entry.json_metadata?.canonical_url;
  if (declared) {
    return declared.replace("https://www.", "https://");
  }

  if (!entry.author || !entry.permlink) {
    return null;
  }

  const self = `${baseUrl}/@${entry.author}/${entry.permlink}`;
  const depth = entry.depth ?? 0;

  if (isContainerTree(entry)) {
    if (depth === 0) {
      // Thin body = machine anchor (no canonical → noindex). A substantive
      // body = a rare real standalone post by the account → treat as normal
      // post (self), so we don't silently suppress a valid page.
      return isContainerAnchorPost(entry) ? null : self;
    }
    if (depth === 1) return self; // the wave/snap is the content unit
    if (depth === 2 && entry.parent_author && entry.parent_permlink) {
      // reply to a wave → the wave (its immediate parent). Known seam: the
      // wave may itself fail the quality gate (noindex); we don't fetch it to
      // check (no SSR fan-out). Same accepted trade-off as the normal
      // reply→possibly-noindexed-root seam — see spec §5.
      return `${baseUrl}/@${entry.parent_author}/${entry.parent_permlink}`;
    }
    return null; // depth >= 3 in a container tree — unresolvable, noindex
  }

  if (depth === 0) return self; // normal top-level post → self

  // normal reply → the depth-0 root post
  if (entry.root_author && entry.root_permlink) {
    return `${baseUrl}/@${entry.root_author}/${entry.root_permlink}`;
  }
  if (depth === 1 && entry.parent_author && entry.parent_permlink) {
    // depth-1 reply: parent IS the root (covers bridge-fed entries lacking root_*)
    return `${baseUrl}/@${entry.parent_author}/${entry.parent_permlink}`;
  }
  return null; // deep reply with no resolvable root — noindex
}

const parsePayout = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/**
 * Source-agnostic effective payout. condenser_api.get_content omits
 * is_paidout/author_payout_value (bridge-shape fields), so read whatever is
 * present and take the max of the numeric `payout` and the summed *_value
 * strings. The §gate floor is coarse — precision is not required.
 */
const effectivePayout = (entry: Entry): number => {
  const summed =
    parsePayout(entry.pending_payout_value) +
    parsePayout(entry.author_payout_value) +
    parsePayout(entry.curator_payout_value);
  return Math.max(parsePayout(entry.payout), summed);
};

/** Tier 0 (content floor) + Tier 1 (engagement) gate for depth-1 waves. */
const passesWaveQualityGate = (entry: Entry): boolean => {
  // Tier 0: intrinsic content floor (NSFW + reputation already checked upstream).
  if (plainBodyLen(entry) < WAVE_MIN_BODY_CHARS) return false;

  // Tier 1: engagement corroboration.
  const children = typeof entry.children === "number" ? entry.children : 0;
  if (children >= WAVE_MIN_CHILDREN) return true;

  const voters = Array.isArray(entry.active_votes) ? entry.active_votes.length : 0;
  return voters >= WAVE_MIN_VOTERS && effectivePayout(entry) >= WAVE_MIN_PAYOUT;
};

/**
 * Whether the entry should be indexed (true) or emit robots noindex (false).
 * The reputation gate needs the fetched author account; callers pass it plus
 * whether that fetch failed (failure => don't punish, skip the rep gate).
 */
export function isIndexable(
  entry: Entry,
  account: ReputationSource,
  accountFetchFailed: boolean
): boolean {
  if (isNsfwEntry(entry)) return false;

  const reputationNoIndex =
    !accountFetchFailed && shouldApplyNoIndex(account, entry.author_reputation ?? 0);
  if (reputationNoIndex) return false;

  const depth = entry.depth ?? 0;

  if (isContainerTree(entry)) {
    if (depth === 0) return !isContainerAnchorPost(entry); // anchor → noindex; real post → index
    if (depth === 1) return passesWaveQualityGate(entry); // the wave/snap
    if (depth === 2) return true; // reply to a wave (canonicals to the wave)
    return false; // depth >= 3 in a container tree
  }

  if (depth === 0) return true; // normal top-level post

  // normal reply: indexable only if its discussion root is resolvable
  return canonicalTarget(entry) !== null;
}
