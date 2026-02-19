import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { capitalize } from "@/utils";
import defaults from "@/defaults";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export async function generateCommunityMetadata(communityName: string, tag: string) {
  const community = await prefetchQuery(getCommunityCache(communityName));
  const account = await prefetchQuery(getAccountFullQueryOptions(communityName));
  if (community && account) {
    const base = await getServerAppBase();
    const title = `${community!!.title.trim()} community ${tag} list`;
    const description = i18next.t("community.page-description", {
      f: `${capitalize(tag)} ${community!!.title.trim()}`
    });
    const metaRss = `${base}/${tag}/${community!!.name}/rss.xml`;
    const metaCanonical = `${base}/created/${community!!.name}`;

    const metaImage = `${defaults.imageServer}/u/${community!!.name}/avatar/medium`;
    return {
      title,
      description,
      alternates: {
        canonical: metaCanonical,
        types: {
          "application/rss+xml": metaRss,
        },
      },
      openGraph: {
        title,
        description,
        url: `/${tag}/${community!!.name}`,
        images: [metaImage],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: [metaImage],
      },
    };
  }

  return {};
}
