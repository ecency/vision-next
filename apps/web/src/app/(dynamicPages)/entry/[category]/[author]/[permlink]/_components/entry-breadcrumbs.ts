import { Entry } from "@/entities";
import { entryDisplayTitle } from "@/utils/entry-display-title";

export interface BreadcrumbCrumb {
  name: string;
  /** Relative path for the visible link. */
  path: string;
  /** Absolute URL for the BreadcrumbList JSON-LD. */
  url: string;
}

/**
 * Build the breadcrumb trail for a post, shared by the visible <nav> and the
 * BreadcrumbList JSON-LD so the two never drift. Top-level posts only (comments
 * return []). The section crumb is omitted when the category is a raw
 * "hive-12345" id and there is no community title, so the trail never surfaces a
 * machine id (mirrors buildArticleJsonLd's articleSection + resolveRelatedSource).
 * The last crumb uses entryDisplayTitle, so a title-less post (e.g. a D.Buzz
 * microblog) never emits an empty BreadcrumbList item name — Google flags
 * those as invalid structured data.
 */
export function buildEntryBreadcrumbs(
  entry: Pick<
    Entry,
    "parent_author" | "category" | "community_title" | "title" | "body" | "author" | "permlink"
  >,
  opts: { siteName: string; base: string; entryUrl: string }
): BreadcrumbCrumb[] {
  if (entry.parent_author) {
    return [];
  }

  const { siteName, base, entryUrl } = opts;
  const isCommunityId = /^hive-\d+$/.test(entry.category ?? "");
  const sectionName = entry.community_title || (isCommunityId ? null : `#${entry.category}`);

  return [
    { name: siteName, path: "/", url: base },
    ...(sectionName
      ? [
          {
            name: sectionName,
            path: `/trending/${entry.category}`,
            url: `${base}/trending/${entry.category}`
          }
        ]
      : []),
    { name: entryDisplayTitle(entry), path: `/@${entry.author}/${entry.permlink}`, url: entryUrl }
  ];
}
