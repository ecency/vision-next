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
 *  - `sorts`: how Communities/Global posts are ranked — Trending, Hot, New, Top
 *  - `overflow`: niche views surfaced behind a "more" menu — Muted, Promoted
 *
 * URL scheme is unchanged: Following → /@user/feed (rewritten to the feed
 * route), Communities → /{sort}/my, Global → /{sort}.
 */
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
  const isFollowing = filter === "feed";
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
  // sort, and overflow views (muted/promoted) aren't real sorts, so default to Hot.
  const currentSort = SORT_FILTERS.includes(filter as EntryFilter)
    ? (filter as EntryFilter)
    : EntryFilter.hot;

  const isMy = useMemo(
    () =>
      activeUser &&
      ((activeUser.username === normalizedTag.replace("@", "") && isFollowing) || tag === "my"),
    [activeUser, isFollowing, normalizedTag, tag]
  );

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
        onClick: () => router.push(tagHref)
      });
    }

    if (activeUser) {
      const followingHref = `/@${activeUser.username}/feed`;
      items.push({
        label: i18next.t("entry-filter.filter-feed-friends"),
        href: followingHref,
        selected: isFollowing,
        id: "following",
        onClick: () => router.push(followingHref)
      });

      const communitiesHref = `/${currentSort}/my`;
      items.push({
        label: i18next.t("entry-filter.filter-feed-subscriptions"),
        href: communitiesHref,
        selected: !!isCommunities,
        id: "communities",
        onClick: () => router.push(communitiesHref)
      });
    }

    const globalHref = `/${currentSort}`;
    items.push({
      label: i18next.t("entry-filter.filter-global"),
      href: globalHref,
      selected: isGlobal,
      id: "global",
      onClick: () => router.push(globalHref)
    });

    return items;
  }, [activeUser, currentSort, hasTag, isCommunities, isFollowing, isGlobal, normalizedTag, router]);

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
          x === EntryFilter.payout
            ? i18next.t("entry-filter.filter-top")
            : i18next.t(`entry-filter.filter-${x}`),
        href,
        selected: (filter as EntryFilter) === x,
        id: x,
        onClick: () => router.push(href)
      };
    });
  }, [filter, isCommunities, normalizedTag, router]);

  const overflow: FeedMenuItem[] = useMemo(
    () => [
      {
        label: i18next.t("entry-filter.filter-muted"),
        href: "/muted",
        selected: filter === "muted",
        id: "muted",
        onClick: () => router.push("/muted")
      },
      {
        label: i18next.t("entry-filter.filter-promoted"),
        href: "/promoted",
        selected: filter === "promoted",
        id: "promoted",
        onClick: () => router.push("/promoted")
      }
    ],
    [filter, router]
  );

  return useMemo(
    () => ({ sources, sorts, overflow, isFollowing, isMy }),
    [isFollowing, isMy, overflow, sorts, sources]
  );
}
