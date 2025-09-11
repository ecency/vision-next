import { capitalize } from "@/utils";
import i18next from "i18next";
import defaults from "@/defaults.json";

export async function generateFeedMetadata(filter: string, tag: string) {
  const fC = capitalize(filter);
  let title = i18next.t("entry-index.title", { f: fC });
  let description = i18next.t("entry-index.description", { f: fC });
  let url = `/${filter}`;
  let canonical = `${defaults.base}/${filter}`;
  let rss = "";

  if (tag?.startsWith("%40")) {
    title = `${tag.replace("%40", "@")} ${filter} on decentralized web – Ecency`;
    description = i18next.t("entry-index.description-user-feed", {
      u: tag.replace("%40", "@"),
    });
  } else if (tag) {
    title = `latest #${tag} ${filter} topics on internet`;
    description = i18next.t("entry-index.description-tag", { f: fC, t: tag });

    url = `/${filter}/${tag}`;
    canonical = `${defaults.base}/${filter}/${tag}`;
    rss = `${defaults.base}/${filter}/${tag}/rss.xml`;
  }

  return { title, description, openGraph: { url } };
}
