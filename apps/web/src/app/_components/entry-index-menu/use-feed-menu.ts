import { useGlobalStore } from "@/core/global-store";
import { EntryFilter } from "@/enums";
import { useInfiniteDataFlow } from "@/utils";
import { getTrendingTagsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MenuItem } from "@ui/dropdown";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export function useFeedMenu() {
  const activeUser = useGlobalStore((s) => s.activeUser);

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
        label: i18next.t(`entry-filter.filter-controversial`),
        href: `/controversial/week`,
        selected: filter === "controversial",
        id: "controversial",
        onClick: () => router.push("/controversial/week")
      },
      {
        label: i18next.t(`entry-filter.filter-rising`),
        href: `/rising/week`,
        selected: filter === "rising",
        id: "rising",
        onClick: () => router.push("/rising/week")
      },
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
        const tagSegment =
          tag === "global"
            ? "global"
            : isMy || (activeUser && !tag)
              ? "my"
              : allTrendingTags.includes(tag)
                ? tag
                : "";
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
