import { useMemo } from "react";
import i18next from "i18next";
import { MenuItem } from "@ui/dropdown";
import { EntryFilter } from "@/enums";
import { useGlobalStore } from "@/core/global-store";
import { useParams, usePathname, useRouter } from "next/navigation";
import { getTrendingTagsQuery } from "@/api/queries";
import { useInfiniteDataFlow } from "@/utils";

export function useFeedMenu() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }
  const router = useRouter();
  const pathname = usePathname();

  const { data: trendingTags } = getTrendingTagsQuery().useClientQuery();
  const allTrendingTags = useInfiniteDataFlow(trendingTags);

  const isMy = useMemo(
    () =>
      activeUser &&
      ((activeUser.username === tag.replace("@", "") && filter === "feed") || tag === "my"),
    [activeUser, filter, tag]
  );
  const isGlobal = useMemo(() => !pathname?.includes("/my"), [pathname]);

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
      ...[EntryFilter.trending, EntryFilter.hot, EntryFilter.created].map((x) => ({
        onClick: () => router.push(`/${x}`),
        label: i18next.t(`entry-filter.filter-${x}`),
        href: activeUser
          ? filter === "feed" && !isGlobal
            ? `/${x}/my`
            : `/${x}/${allTrendingTags.includes(tag) ? tag : ""}`
          : tag[0] === "@"
            ? `/${x}`
            : `/${x}${tag ? `/${tag}` : ""}`,
        selected: (filter as unknown as EntryFilter) === x || filter === x + "/my",
        id: x
      }))
    ],
    [activeUser, allTrendingTags, filter, isGlobal, router, tag]
  );

  return useMemo(() => [menuItems, secondaryMenu, isMy] as const, [isMy, menuItems, secondaryMenu]);
}
