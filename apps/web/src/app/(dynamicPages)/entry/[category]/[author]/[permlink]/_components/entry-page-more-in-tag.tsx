import { Entry } from "@/entities";
import { fetchQuery } from "@/core/react-query";
import { getPostsRankedQueryOptions } from "@ecency/sdk";
import { initI18next } from "@/features/i18n";
import i18next from "i18next";
import { EntryRelatedList } from "./entry-related-list";
import { resolveRelatedSource, isLinkableRelated } from "./entry-related-source";

const FETCH_LIMIT = 12;
const RENDER_COUNT = 6;
const MIN_RENDER = 2;

interface Props {
  entry: Entry;
}

/**
 * "More in {community or #tag}" — durable, server-rendered links to other
 * recent posts in the same community/tag. Async server component (see
 * EntryPageMoreFromAuthor for the SSR/dehydration rationale). Excludes the
 * current post and the post's own author so it doesn't duplicate the
 * "More from author" block or self-link. Top-level posts only.
 */
export async function EntryPageMoreInTag({ entry }: Props) {
  if (entry.parent_author) {
    return null;
  }

  const source = resolveRelatedSource(entry);
  if (!source) {
    return null;
  }

  // SDK/web Entry boundary cast (see EntryPageMoreFromAuthor).
  const posts = (await fetchQuery(
    getPostsRankedQueryOptions("created", "", "", FETCH_LIMIT, source.tag)
  )) as unknown as Entry[] | undefined;

  // This is a cross-author feed, so dedup on author+permlink: a Hive permlink is
  // unique only per author, and distinct posts can share a slug.
  const seen = new Set<string>();
  const entries = (posts ?? [])
    .filter((p) => {
      const key = `${p.author}/${p.permlink}`;
      if (p.author === entry.author || seen.has(key) || !isLinkableRelated(p)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, RENDER_COUNT);

  if (entries.length < MIN_RENDER) {
    return null;
  }

  await initI18next();
  return (
    <EntryRelatedList
      title={i18next.t("related-posts.more-in", { section: source.section })}
      entries={entries}
    />
  );
}
