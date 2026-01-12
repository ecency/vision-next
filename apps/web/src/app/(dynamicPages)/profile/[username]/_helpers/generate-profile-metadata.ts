import { Metadata } from "next";
import defaults from "@/defaults";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export async function generateProfileMetadata(
  username: string,
  section = "posts"
): Promise<Metadata> {
  const account = await prefetchQuery(getAccountFullQueryOptions(username));
  if (account) {
    const base = await getServerAppBase();
    const metaTitle = `${account.profile?.name || account.name}'s ${
      section ? (section === "engine" ? "tokens" : `${section}`) : ""
    } on decentralized web`;
    const metaDescription = `${
      account.profile?.about
        ? `${account.profile?.about} ${section ? `${section}` : ""}`
        : `${account.profile?.name || account.name} ${section ? `${section}` : ""}`
    }`;
    const metaUrl = `/@${username.replace("@", "")}${section ? `/${section}` : ""}`;
    const metaCanonical = `${base}/@${username.replace("@", "")}${
      section ? `/${section}` : ""
    }`;
    const metaRss = `${base}/@${username.replace("@", "")}/rss`;
    const metaKeywords = `${username.replace("@", "")}, ${username.replace("@", "")}'s blog`;
    const metaImage = `${defaults.imageServer}/u/${username.replace("@", "")}/avatar/medium`;
    return {
      title: metaTitle,
      description: metaDescription,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        images: [metaImage],
        url: metaUrl,
        tags: metaKeywords
      }
    };
  }

  return {};
}
