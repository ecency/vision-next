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

  function buildForFeed(username: string): Metadata {
    return {
      title: `@${username}'s community feed on decentralized web`,
      description: i18next.t("entry-feed.description-user-feed", { u: username })
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
