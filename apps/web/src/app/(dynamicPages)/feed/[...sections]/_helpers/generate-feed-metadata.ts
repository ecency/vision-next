import { Metadata } from "next";
import { capitalize } from "@/utils";
import i18next from "i18next";
import { getServerAppBase } from "@/utils/server-app-base";
import defaults from "@/defaults.json";
import { accountFeedUsername, feedIndexing } from "./feed-indexing";

export async function generateFeedMetadata(
  filter: string,
  tag: string,
  cursor?: string
): Promise<Metadata> {
  const fC = capitalize(filter);
  const base = await getServerAppBase();
  // Which URL this page is the canonical copy of, and whether it belongs in the
  // index at all. Never `/{filter}` for an account feed — that spelling is a
  // 404 (#1800); see feed-indexing.ts for the whole table.
  const { path: url, robots } = feedIndexing(filter, tag);
  const canonical = `${base}${url}`;
  const username = accountFeedUsername(tag);
  let title = i18next.t("entry-index.title", { f: fC });
  let description = i18next.t("entry-index.description", { f: fC });
  let rss = "";

  if (username) {
    // Brand ("| Ecency") is appended by the root title.template; keep bare.
    title = `@${username} ${filter}`;
    description = i18next.t("entry-index.description-user-feed", {
      u: `@${username}`,
    });
  } else if (tag) {
    title = `latest #${tag} ${filter} topics`;
    // "Created #tag posts..." reads oddly in a snippet; label that sort "Latest".
    const fLabel = filter === "created" ? "Latest" : fC;
    description = i18next.t("entry-index.description-tag", { f: fLabel, t: tag });

    rss = `${base}/${filter}/${tag}/rss.xml`;
  }

  // Cursor archive page: keep it out of the index but let crawlers walk the
  // pager chain (noindex, follow), self-canonical to the ?before URL, no RSS.
  const isPaginated = !!cursor;

  return {
    title: isPaginated ? `${title} - older` : title,
    description,
    ...(isPaginated || robots ? { robots: robots ?? "noindex, follow" } : {}),
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
      site: defaults.twitterHandle,
      title,
      description,
    },
  };
}
