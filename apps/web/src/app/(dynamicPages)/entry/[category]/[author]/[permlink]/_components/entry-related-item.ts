import { Entry } from "@/entities";
import { catchPostImage } from "@ecency/render-helper";

/** Minimal shape a related-post row needs, normalized across sources. */
export interface RelatedItem {
  author: string;
  permlink: string;
  title: string;
  category: string;
  image?: string;
  created: string;
}

// Thumbnails render at ~46px; request 2x so they stay crisp on retina. The
// proxy bakes the size into the URL, so this is the actual bytes served.
const THUMB_PX = 120;

export function relatedItemFromEntry(e: Entry): RelatedItem {
  return {
    author: e.author,
    permlink: e.permlink,
    title: e.title,
    category: e.category,
    image: catchPostImage(e, THUMB_PX, THUMB_PX) || undefined,
    created: e.created
  };
}

/** The narrow row shape the SDK's similar-entries query returns. */
export interface SimilarRow {
  author?: string;
  permlink?: string;
  title?: string;
  category?: string;
  img_url?: string;
  created_at?: string;
}

export function relatedItemFromSimilar(r: SimilarRow): RelatedItem | null {
  if (!r.author || !r.permlink) {
    return null;
  }
  return {
    author: r.author,
    permlink: r.permlink,
    title: r.title ?? "",
    category: r.category ?? "",
    image: r.img_url ? catchPostImage(r.img_url, THUMB_PX, THUMB_PX) || undefined : undefined,
    created: r.created_at ?? ""
  };
}

export interface RelatedColumn {
  title: string;
  items: RelatedItem[];
}

/**
 * Pick the columns to render from ordered candidate sources.
 * - Dedups across ALL columns (and against `excludeKey`, the current post) so a
 *   post never appears twice; earlier sources claim a post first.
 * - Caps each column at `perColumn`.
 * - DROPS any column left with fewer than `minColumn` items — so a sparse source
 *   (e.g. a brand-new author with no other posts) simply doesn't render, and the
 *   grid collapses to the remaining columns instead of showing a lonely stub.
 */
export function selectRelatedColumns(
  sources: RelatedColumn[],
  opts: { perColumn: number; minColumn: number; excludeKey?: string }
): RelatedColumn[] {
  const seen = new Set<string>();
  if (opts.excludeKey) {
    seen.add(opts.excludeKey);
  }
  const result: RelatedColumn[] = [];
  for (const src of sources) {
    const picked: RelatedItem[] = [];
    for (const it of src.items) {
      const key = `${it.author}/${it.permlink}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      picked.push(it);
      if (picked.length >= opts.perColumn) {
        break;
      }
    }
    if (picked.length >= opts.minColumn) {
      result.push({ title: src.title, items: picked });
    }
  }
  return result;
}
