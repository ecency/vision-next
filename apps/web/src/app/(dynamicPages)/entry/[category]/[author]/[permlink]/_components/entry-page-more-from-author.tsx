import { Entry } from "@/entities";
import { fetchQuery } from "@/core/react-query";
import { getAccountPostsQueryOptions } from "@ecency/sdk";
import { initI18next } from "@/features/i18n";
import i18next from "i18next";
import { EntryRelatedList } from "./entry-related-list";
import { isLinkableRelated } from "./entry-related-source";

const FETCH_LIMIT = 12;
const RENDER_COUNT = 6;
const MIN_RENDER = 2;

interface Props {
  entry: Entry;
}

/**
 * "More from @author" — durable, server-rendered links to the author's other
 * recent posts. Async server component: the `fetchQuery` resolves during the
 * render pass (bounded by the SSR timeout), so the links are in the initial
 * server HTML and crawlable. The fetched data is NOT dehydrated into the client
 * payload because the entry page captures its dehydrate snapshot before this
 * subtree renders. Shown for top-level posts only.
 */
export async function EntryPageMoreFromAuthor({ entry }: Props) {
  if (entry.parent_author) {
    return null;
  }

  // SDK and web both model a Hive post as `Entry`; the SDK/web type split is
  // deliberately deferred (see SimilarEntries), so cross the boundary once here.
  const posts = (await fetchQuery(
    getAccountPostsQueryOptions(entry.author, "posts", "", "", FETCH_LIMIT)
  )) as unknown as Entry[] | undefined;

  const seen = new Set<string>([entry.permlink]);
  const entries = (posts ?? [])
    .filter((p) => {
      if (p.author !== entry.author || seen.has(p.permlink) || !isLinkableRelated(p)) {
        return false;
      }
      seen.add(p.permlink);
      return true;
    })
    .slice(0, RENDER_COUNT);

  if (entries.length < MIN_RENDER) {
    return null;
  }

  await initI18next();
  return (
    <EntryRelatedList
      title={i18next.t("related-posts.more-from-author", { username: entry.author })}
      entries={entries}
    />
  );
}
