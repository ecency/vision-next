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
    const cleanUsername = username.replace("@", "");
    const metaTitle = `${account.profile?.name || account.name}'s ${
      section ? (section === "engine" ? "tokens" : `${section}`) : ""
    } on decentralized web`;
    const metaDescription = `${
      account.profile?.about
        ? `${account.profile?.about} ${section ? `${section}` : ""}`
        : `${account.profile?.name || account.name} ${section ? `${section}` : ""}`
    }`;
    const metaUrl = `/@${cleanUsername}${section ? `/${section}` : ""}`;
    const metaImage = `${defaults.imageServer}/u/${cleanUsername}/avatar/medium`;
    const metaKeywords = [cleanUsername, `${cleanUsername}'s blog`];
    const rssSections = ["posts", "blog", ""];
    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: `${base}${metaUrl}`,
        ...(rssSections.includes(section) && {
          types: {
            "application/rss+xml": `${base}/@${cleanUsername}/rss`,
          },
        }),
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        images: [metaImage],
        url: metaUrl,
        tags: metaKeywords,
      },
      twitter: {
        card: "summary",
        title: metaTitle,
        description: metaDescription,
        images: [metaImage],
      },
    };
  }

  return {};
}
