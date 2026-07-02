import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { capitalize, truncate } from "@/utils";
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
    // This helper also serves non-feed sections (subscribers/activities/roles),
    // where a "posts" suffix would be wrong — keep the old generic "list" there.
    const communityTitle = community.title.trim();
    const isFeedTag = ["created", "trending", "hot"].includes(tag);
    const feedLabel = tag === "created" ? "Latest" : capitalize(tag);
    // Bare titles; the root title.template appends "| Ecency".
    const title = isFeedTag
      ? `${communityTitle} community${tag === "created" ? "" : ` ${tag}`} posts`
      : `${communityTitle} community ${tag} list`;
    // The community's own about text is the most distinctive snippet we have
    // (about only: `description` is free-form markdown — rules/links — that
    // would leak raw syntax into a truncated meta description).
    const rawAbout = community.about;
    const communityAbout =
      typeof rawAbout === "string" ? rawAbout.replace(/\s+/g, " ").trim() : "";
    const description = communityAbout
      ? truncate(communityAbout, 160)
      : i18next.t("community.page-description", {
          f: isFeedTag ? `${feedLabel} ${communityTitle}` : communityTitle
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
