import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { capitalize } from "@/utils";
import defaults from "@/defaults";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export async function generateCommunityMetadata(
  communityName: string,
  tag: string,
  cursor?: string
) {
  const [community, account, base] = await Promise.all([
    prefetchQuery(getCommunityCache(communityName)),
    prefetchQuery(getAccountFullQueryOptions(communityName)),
    getServerAppBase()
  ]);
  if (community && account) {
    const title = `${community.title.trim()} community ${tag} list`;
    const description = i18next.t("community.page-description", {
      f: `${capitalize(tag)} ${community.title.trim()}`
    });
    const metaRss = `${base}/${tag}/${community.name}/rss.xml`;
    const metaCanonical = `${base}/created/${community.name}`;

    const metaImage = `${defaults.imageServer}/u/${community.name}/avatar/medium`;
    // Cursor archive page: keep out of the index, let crawlers follow the pager
    // (noindex, follow), self-canonical to the ?before URL, no RSS.
    const isPaginated = !!cursor;
    return {
      title: isPaginated ? `${title} - older` : title,
      description,
      ...(isPaginated ? { robots: "noindex, follow" } : {}),
      alternates: {
        canonical: isPaginated ? `${base}/${tag}/${community.name}?before=${cursor}` : metaCanonical,
        ...(isPaginated ? {} : { types: { "application/rss+xml": metaRss } }),
      },
      openGraph: {
        title,
        description,
        url: isPaginated ? `/${tag}/${community.name}?before=${cursor}` : `/${tag}/${community.name}`,
        images: [metaImage],
      },
      twitter: {
        card: "summary",
        site: defaults.twitterHandle,
        title,
        description,
        images: [metaImage],
      },
    };
  }

  return {};
}
