import { getCommunityCache } from "@/core/caches";
import { getAccountFullQuery } from "@/api/queries";
import i18next from "i18next";
import { capitalize } from "@/utils";
import defaults from "@/defaults.json";

export async function generateCommunityMetadata(communityName: string, tag: string) {
  const community = await getCommunityCache(communityName).prefetch();
  const account = await getAccountFullQuery(communityName).prefetch();
  if (community && account) {
    const title = `${community!!.title.trim()} community ${tag} list`;
    const description = i18next.t("community.page-description", {
      f: `${capitalize(tag)} ${community!!.title.trim()}`
    });
    const metaRss = `${defaults.base}/${tag}/${community!!.name}/rss.xml`;
    const metaCanonical = `${defaults.base}/created/${community!!.name}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `/${tag}/${community!!.name}`,
        images: [`${defaults.imageServer}/u/${community!!.name}/avatar/medium`]
      }
    };
  }

  return {};
}
