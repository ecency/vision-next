import { EntryFilter } from "@/enums";
import { useInfiniteDataFlow } from "@/utils";
import { getTrendingTagsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MenuItem } from "@ui/dropdown";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useFeedMenu() {
  const { activeUser } = useActiveAccount();

  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }
  const router = useRouter();

  const { data: trendingTags } = useInfiniteQuery(getTrendingTagsQueryOptions(250));
  const allTrendingTags = useInfiniteDataFlow(trendingTags);

  const isMy = useMemo(
    () =>
      activeUser &&
      ((activeUser.username === tag.replace("@", "") && filter === "feed") || tag === "my"),
    [activeUser, filter, tag]
  );

  const secondaryMenu = useMemo(
    () => [
      {
        label: i18next.t(`entry-filter.filter-promoted`),
        href: `/promoted`,
        selected: filter === "promoted",
        id: "promoted",
        onClick: () => router.push("/promoted")
      }
    ],
    [filter, router]
  );

  const menuItems: MenuItem[] = useMemo(
    () => [
      ...(activeUser
        ? [
            {
              label: i18next.t(`entry-filter.filter-feed-friends`),
              href: `/@${activeUser?.username}/feed`,
              selected: filter === "feed",
              id: "feed",
              onClick: () => router.push(`/@${activeUser?.username}/feed`)
            }
          ]
        : []),
      ...[EntryFilter.trending, EntryFilter.hot, EntryFilter.created].map((x) => {
        // Determine tag segment based on current context
        let tagSegment = "";

        if (filter === "feed") {
          // When switching FROM feed TO trending/hot/created:
          // - If it's your own feed (@username === activeUser), go to /my
          // - Otherwise go to global (no tag)
          const isOwnFeed = activeUser && tag === `@${activeUser.username}`;
          tagSegment = isOwnFeed ? "my" : "";
        } else {
          // When already on trending/hot/created, preserve the tag context
          tagSegment = tag === "global" ? "" : tag;
        }

        const href = `/${x}${tagSegment ? `/${tagSegment}` : ""}`;

        return {
          onClick: () => router.push(href),
          label: i18next.t(`entry-filter.filter-${x}`),
          href,
          selected: (filter as unknown as EntryFilter) === x,
          id: x
        };
      })
    ],
    [activeUser, allTrendingTags, filter, isMy, router, tag]
  );

  return useMemo(() => [menuItems, secondaryMenu, isMy] as const, [isMy, menuItems, secondaryMenu]);
}
