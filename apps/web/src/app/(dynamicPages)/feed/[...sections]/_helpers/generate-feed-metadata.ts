import { capitalize } from "@/utils";
import i18next from "i18next";
import { getServerAppBase } from "@/utils/server-app-base";

export async function generateFeedMetadata(filter: string, tag: string, cursor?: string) {
  const fC = capitalize(filter);
  const base = await getServerAppBase();
  let title = i18next.t("entry-index.title", { f: fC });
  let description = i18next.t("entry-index.description", { f: fC });
  let url = `/${filter}`;
  let canonical = `${base}/${filter}`;
  let rss = "";

  if (tag?.startsWith("%40")) {
    title = `${tag.replace(/%40/g, "@")} ${filter} on decentralized web – Ecency`;
    description = i18next.t("entry-index.description-user-feed", {
      u: tag.replace(/%40/g, "@"),
    });
  } else if (tag) {
    title = `latest #${tag} ${filter} topics on internet`;
    description = i18next.t("entry-index.description-tag", { f: fC, t: tag });

    url = `/${filter}/${tag}`;
    canonical = `${base}/${filter}/${tag}`;
    rss = `${base}/${filter}/${tag}/rss.xml`;
  }

  // Cursor archive page: keep it out of the index but let crawlers walk the
  // pager chain (noindex, follow), self-canonical to the ?before URL, no RSS.
  const isPaginated = !!cursor;

  return {
    title: isPaginated ? `${title} - older` : title,
    description,
    ...(isPaginated ? { robots: "noindex, follow" } : {}),
    alternates: {
      canonical: isPaginated ? `${canonical}?before=${cursor}` : canonical,
      ...(rss && !isPaginated && { types: { "application/rss+xml": rss } }),
    },
    openGraph: {
      title,
      description,
      url: isPaginated ? `${url}?before=${cursor}` : url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
