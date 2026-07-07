import { BeneficiaryRoute } from "@/entities";

/**
 * Hive protocol limits.
 * - A `comment_options` operation accepts at most 8 beneficiary slots.
 * - Beneficiary weights are expressed in basis points (10000 = 100%).
 */
export const HIVE_MAX_BENEFICIARIES = 8;
export const HIVE_MAX_TOTAL_WEIGHT = 10000;

/**
 * DecentMemes policy: the total reward routed to meme creators on a top-level
 * post is capped at 10% (1000 basis points), matching the widget spec's
 * post-aggregation cap. The widget dictates these beneficiaries, so we never
 * trust its numbers blindly - this cap (and the merge logic below) is enforced
 * entirely on our side.
 */
export const DECENTMEMES_POST_MAX_WEIGHT = 1000;

/**
 * On a comment / Wave the widget spec allows a larger total (creator 5% +
 * submitter 10% + 1% frontend), capped at 30% (3000 basis points).
 */
export const DECENTMEMES_COMMENT_MAX_WEIGHT = 3000;

/**
 * Lightweight Hive account-name check (defense-in-depth - the widget is the
 * primary authority for who its templates pay). Mirrors the pattern used
 * elsewhere in the app: starts with a letter, 3-16 chars, lowercase letters /
 * digits / dot / hyphen. Keeps malformed names from reaching the broadcast,
 * where they would fail with a cryptic "Invalid account name" error.
 */
const HIVE_ACCOUNT_RE = /^[a-z][a-z0-9.-]{2,15}$/;

interface NormalizedBeneficiary {
  account: string;
  weight: number;
}

function totalWeight(list: { weight: number }[]): number {
  return list.reduce((sum, b) => sum + b.weight, 0);
}

/**
 * Aggregate a raw list of meme beneficiaries coming from the widget into a
 * clean `{ account, weight }` list:
 * - drops the unsupported `role` field (and any other extra keys)
 * - drops invalid entries (missing account, non-positive / non-finite weight)
 * - sums weights for duplicate accounts
 */
export function aggregateMemeBeneficiaries(
  raw: { account?: string; weight?: number }[] = []
): NormalizedBeneficiary[] {
  const byAccount = new Map<string, number>();
  for (const entry of raw) {
    const account = entry?.account?.trim();
    const weight = Math.round(Number(entry?.weight));
    if (!account || !HIVE_ACCOUNT_RE.test(account) || !Number.isFinite(weight) || weight <= 0) {
      continue;
    }
    byAccount.set(account, (byAccount.get(account) ?? 0) + weight);
  }
  return Array.from(byAccount.entries()).map(([account, weight]) => ({ account, weight }));
}

/**
 * Proportionally scale a beneficiary list down so its total weight does not
 * exceed `cap`. Entries that round down to 0 are dropped.
 */
function scaleToCap(list: NormalizedBeneficiary[], cap: number): NormalizedBeneficiary[] {
  const total = totalWeight(list);
  if (total <= cap) {
    return list;
  }
  if (cap <= 0) {
    return [];
  }
  const factor = cap / total;
  return list
    .map((b) => ({ account: b.account, weight: Math.floor(b.weight * factor) }))
    .filter((b) => b.weight > 0);
}

export interface EnforceResult {
  beneficiaries: BeneficiaryRoute[];
  /** True when some meme beneficiaries could not be applied (no slot/weight headroom). */
  dropped: boolean;
}

/**
 * Merge widget-supplied meme beneficiaries into the user's existing beneficiary
 * list while strictly respecting Hive limits. User-set beneficiaries are never
 * modified or dropped; only the meme contribution is capped, scaled, or dropped
 * to fit. Returns `dropped: true` when something had to be left out so the
 * caller can warn the user instead of letting the broadcast fail silently.
 */
export function enforceDecentMemesBeneficiary(
  existing: BeneficiaryRoute[] = [],
  memeBeneficiaries: { account?: string; weight?: number }[] = [],
  author?: string,
  maxMemeWeight: number = DECENTMEMES_POST_MAX_WEIGHT
): EnforceResult {
  let dropped = false;

  // 1. Clean the widget input (invalid account names / weights are dropped) and
  //    cap the meme contribution to the per-context maximum (10% post / 30% comment).
  let meme = aggregateMemeBeneficiaries(memeBeneficiaries);
  if (author) {
    // Hive rejects any comment_options where a beneficiary equals the author,
    // so a widget that lists the author is silently filtered out rather than
    // failing the whole broadcast.
    const authorLower = author.toLowerCase();
    meme = meme.filter((b) => b.account.toLowerCase() !== authorLower);
  }
  const postCapped = scaleToCap(meme, maxMemeWeight);
  if (totalWeight(postCapped) < totalWeight(meme)) {
    dropped = true;
  }
  meme = postCapped;

  // 2. Scale the whole meme contribution down to the remaining weight headroom.
  const existingTotal = totalWeight(existing);
  const headroom = Math.max(0, HIVE_MAX_TOTAL_WEIGHT - existingTotal);
  const headroomCapped = scaleToCap(meme, headroom);
  if (totalWeight(headroomCapped) < totalWeight(meme)) {
    dropped = true;
  }
  meme = headroomCapped;

  // 3. The slot limit only constrains brand-new accounts (bumps reuse a slot).
  // Existing rows can come from restored editor state with arbitrary casing;
  // Hive treats account names case-insensitively, so match them that way to
  // never emit two rows for the same account.
  const existingAccounts = new Set(existing.map((b) => b.account.toLowerCase()));
  const bumps = meme.filter((b) => existingAccounts.has(b.account.toLowerCase()));
  let additions = meme.filter((b) => !existingAccounts.has(b.account.toLowerCase()));

  const slotHeadroom = Math.max(0, HIVE_MAX_BENEFICIARIES - existing.length);
  if (additions.length > slotHeadroom) {
    additions = [...additions].sort((a, b) => b.weight - a.weight).slice(0, slotHeadroom);
    dropped = true;
  }

  // 4. Apply bumps to existing entries, then append surviving new additions.
  const bumpByAccount = new Map(bumps.map((b) => [b.account.toLowerCase(), b.weight]));
  const merged: BeneficiaryRoute[] = existing.map((b) =>
    bumpByAccount.has(b.account.toLowerCase())
      ? // normalize the merged row: Hive account names are lowercase, so a
        // mixed-case restored row would fail the broadcast as an invalid name
        {
          ...b,
          account: b.account.toLowerCase(),
          weight: b.weight + bumpByAccount.get(b.account.toLowerCase())!
        }
      : b
  );
  additions.forEach((b) => merged.push({ account: b.account, weight: b.weight }));

  return { beneficiaries: merged, dropped };
}
