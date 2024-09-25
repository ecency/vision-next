import { Metadata, ResolvingMetadata } from "next";
import { getAccountFullQuery, getPostQuery } from "@/api/queries";
import { PageDetector } from "@/app/[...slugs]/_utils/page-detector";
import defaults from "@/defaults.json";
import { capitalize, parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { getCommunityCache } from "@/core/caches";
import i18next from "i18next";
import { initI18next } from "@/features/i18n";

export namespace MetadataGenerator {
  interface Props {
    params: { slugs: string[] };
    searchParams: Record<string, string | undefined>;
  }

  async function buildForIndex(filter: string, tag: string): Promise<Metadata> {
    const fC = capitalize(filter);
    let title = i18next.t("entry-index.title", { f: fC });
    let description = i18next.t("entry-index.description", { f: fC });
    let url = `/${filter}`;
    let canonical = `${defaults.base}/${filter}`;
    let rss = "";

    if (tag) {
      title = `latest #${tag} ${filter} topics on internet`;
      description = i18next.t("entry-index.description-tag", { f: fC, t: tag });

      url = `/${filter}/${tag}`;
      canonical = `${defaults.base}/${filter}/${tag}`;
      rss = `${defaults.base}/${filter}/${tag}/rss.xml`;
    }

    return { title, description, openGraph: { url } };
  }

  async function buildForEdit(username: string, permlink: string): Promise<Metadata> {
    const forEntry = await buildForEntry(username, permlink);
    return {
      ...forEntry,
      title: `Edit – ${forEntry.title}`
    };
  }

  function buildForFeed(username: string): Metadata {
    return {
      title: `@${username}'s community feed on decentralized web`,
      description: i18next.t("entry-index.description-user-feed", { u: username })
    };
  }

  export async function build(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
    await initI18next();
    const page = PageDetector.detect(props);

    switch (page) {
      case "entry":
        return buildForEntry(
          props.params.slugs[1].replace("%40", "").replace("@", ""),
          props.params.slugs[2]
        );
      case "profile":
        return buildForProfile(
          props.params.slugs[0].replace("%40", ""),
          props.params.slugs[1] ?? "posts"
        );
      case "community":
        return buildForCommunity(props.params.slugs[0], props.params.slugs[1]);
      case "index":
        return buildForIndex(props.params.slugs[0], props.params.slugs[1]);
      case "edit":
        return buildForEdit(
          props.params.slugs[0].replace("%40", "").replace("@", ""),
          props.params.slugs[1]
        );
      case "feed":
        return buildForFeed(props.params.slugs[0].replace("%40", ""));
    }

    return {};
  }
}
