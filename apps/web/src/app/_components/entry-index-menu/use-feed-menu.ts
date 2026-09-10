import { EntryFilter } from "@/enums";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export interface FeedMenuItem {
  label: string;
  href: string;
  selected: boolean;
  id: string;
  onClick: () => void;
  /**
   * The feed `href` resolves to, as the catch-all route's own two segments.
   *
   * Carried alongside the href rather than parsed back out of it: the URLs here
   * are the PUBLIC ones and next.config rewrites them (`/@user/feed` ->
   * `/feed/feed/@user`, `/tags/x` -> `/feed/created/x`), so a consumer that
   * needs the feed's identity — the cached repaint, which looks up the query
   * key of the feed a navigation is heading to — would otherwise have to keep
   * its own copy of that rewrite table in step with next.config. The tag is the
   * raw URL segment; normalising it is `normalizeFeedTag`'s job, and the page
   * does exactly that with the same input.
   */
  feed: { filter: string; tag: string };
}

// Sort filters that apply to the Communities and Global sources.
// "Following" is chronological and has no sort, so it is excluded here.
const SORT_FILTERS: EntryFilter[] = [
  EntryFilter.trending,
  EntryFilter.hot,
  EntryFilter.created,
  EntryFilter.payout
];

/**
 * Splits the feed filter bar into two orthogonal axes:
 *  - `sources`: where posts come from — Following, Communities, Global
 *    (Following/Communities require an active user; Global is always present)
 *  - `sorts`: how Communities/Global posts are ranked — Trending, Hot, New, Payout
 *  - `additionalFilters`: additional feed views — Muted, Promoted
 *
 * URL scheme is unchanged: Following → /@user/feed (rewritten to the feed
 * route), Communities → /{sort}/my, Global → /{sort}.
 */
/**
 * The Communities source lives at `/{sort}/my` (see `communitiesHref` below), so
 * recognising it has to anchor on that trailing segment. An unanchored match also
 * catches every tag that merely begins with "my". An unanchored replace then
 * rewrites the FIRST occurrence: /created/myhivejourney became /createdhivejourney,
 * a 404 served to any logged-out visitor opening such a feed.
 *
 * Returns the Global path to fall back to, or null when this is not a `/my` feed.
 */
export function globalFeedFallbackPath(pathname: string | null | undefined): string | null {
  if (!pathname?.endsWith("/my")) {
    return null;
  }
  return pathname.slice(0, -"/my".length) || "/";
}

export function useFeedMenu() {
  const { activeUser } = useActiveAccount();

  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }
  const router = useRouter();

  const normalizedTag = tag.replace(/%40/g, "@");
  // "Following" is a logged-in-only personal feed. A logged-out visitor landing
  // on a feed URL (e.g. /@bob/feed) must NOT enter Following mode — otherwise the
  // bar collapses to just the reblog toggle with no way back to Global/sorts.
  const isFollowing = filter === "feed" && !!activeUser;
  const isCommunities = tag === "my";
  // A specific hashtag/community feed (e.g. /trending/photography) is its own
  // source: Global should NOT appear selected, but the sort tabs stay and keep
  // the tag. "@user" tags belong to the Following feed, not a hashtag.
  const hasTag =
    !isFollowing &&
    !isCommunities &&
    normalizedTag !== "" &&
    normalizedTag !== "global" &&
    !normalizedTag.startsWith("@");
  const isGlobal = !isFollowing && !isCommunities && !hasTag;

  // Sort to carry when switching between Communities and Global. Following has no
  // sort, and additional views (muted/promoted) aren't real sorts, so default to Hot.
  const currentSort = SORT_FILTERS.includes(filter as EntryFilter)
    ? (filter as EntryFilter)
    : EntryFilter.hot;

  const sources: FeedMenuItem[] = useMemo(() => {
    const items: FeedMenuItem[] = [];

    // Active hashtag/community shows as a selected chip so Global reads as a
    // "clear tag" action rather than the current state.
    if (hasTag) {
      const tagHref = `/${currentSort}/${normalizedTag}`;
      items.push({
        label: `#${normalizedTag}`,
        href: tagHref,
        selected: true,
        id: "tag",
        onClick: () => router.push(tagHref),
        feed: { filter: currentSort, tag: normalizedTag }
      });
    }

    if (activeUser) {
      const followingHref = `/@${activeUser.username}/feed`;
      items.push({
        label: i18next.t("entry-filter.filter-feed-friends"),
        href: followingHref,
        selected: isFollowing,
        id: "following",
        onClick: () => router.push(followingHref),
        // The rewrite sends /@user/feed to the catch-all as `feed/@user`.
        feed: { filter: "feed", tag: `@${activeUser.username}` }
      });

      const communitiesHref = `/${currentSort}/my`;
      items.push({
        label: i18next.t("entry-filter.filter-feed-subscriptions"),
        href: communitiesHref,
        selected: !!isCommunities,
        id: "communities",
        onClick: () => router.push(communitiesHref),
        feed: { filter: currentSort, tag: "my" }
      });
    }

    const globalHref = `/${currentSort}`;
    items.push({
      label: i18next.t("entry-filter.filter-global"),
      href: globalHref,
      selected: isGlobal,
      id: "global",
      onClick: () => router.push(globalHref),
      feed: { filter: currentSort, tag: "" }
    });

    return items;
  }, [
    activeUser,
    currentSort,
    hasTag,
    isCommunities,
    isFollowing,
    isGlobal,
    normalizedTag,
    router
  ]);

  const sorts: FeedMenuItem[] = useMemo(() => {
    // Preserve the current source context when changing sort:
    //  - Communities → keep /my
    //  - Global with a specific tag (e.g. /trending/photography) → keep that tag
    //  - otherwise → global (no tag)
    const tagSegment = isCommunities
      ? "my"
      : normalizedTag && normalizedTag !== "global" && !normalizedTag.startsWith("@")
        ? normalizedTag
        : "";

    return SORT_FILTERS.map((x) => {
      const href = `/${x}${tagSegment ? `/${tagSegment}` : ""}`;
      return {
        label:
          x === EntryFilter.payout ? i18next.t("g.payout") : i18next.t(`entry-filter.filter-${x}`),
        href,
        selected: (filter as EntryFilter) === x,
        id: x,
        onClick: () => router.push(href),
        feed: { filter: x, tag: tagSegment }
      };
    });
  }, [filter, isCommunities, normalizedTag, router]);

  const additionalFilters: FeedMenuItem[] = useMemo(
    () => [
      {
        label: i18next.t("entry-filter.filter-muted"),
        href: "/muted",
        selected: filter === "muted",
        id: "muted",
        onClick: () => router.push("/muted"),
        feed: { filter: "muted", tag: "" }
      },
      {
        label: i18next.t("entry-filter.filter-promoted"),
        href: "/promoted",
        selected: filter === "promoted",
        id: "promoted",
        onClick: () => router.push("/promoted"),
        feed: { filter: "promoted", tag: "" }
      }
    ],
    [filter, router]
  );

  return useMemo(
    () => ({ sources, sorts, additionalFilters, isFollowing, filter, tag: normalizedTag }),
    [isFollowing, additionalFilters, sorts, sources, filter, normalizedTag]
  );
}
