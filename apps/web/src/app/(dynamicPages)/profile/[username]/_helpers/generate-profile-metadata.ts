import { Metadata } from "next";
import defaults from "@/defaults";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { accountReputation } from "@/utils";

const NOINDEX_REPUTATION_THRESHOLD = 40;

export async function generateProfileMetadata(
  username: string,
  section = "posts",
  page = 1
): Promise<Metadata> {
  const account = await prefetchQuery(getAccountFullQueryOptions(username));
  if (account) {
    const base = await getServerAppBase();
    const cleanUsername = username.replace("@", "");
    const metaTitle = `${account.profile?.name || account.name}'s ${
      section ? (section === "engine" ? "tokens" : `${section}`) : ""
    } on decentralized web${page > 1 ? ` - page ${page}` : ""}`;
    const metaDescription = `${
      account.profile?.about
        ? `${account.profile?.about} ${section ? `${section}` : ""}`
        : `${account.profile?.name || account.name} ${section ? `${section}` : ""}`
    }`;
    const isPaginated = page > 1;
    const baseUrl = `/@${cleanUsername}${section ? `/${section}` : ""}`;
    const metaUrl = isPaginated ? `${baseUrl}/page/${page}` : baseUrl;
    const metaImage = `${defaults.imageServer}/u/${cleanUsername}/avatar/medium`;
    const metaKeywords = [cleanUsername, `${cleanUsername}'s blog`];
    const rssSections = ["posts", "blog", ""];

    const reputationScore = accountReputation(account.reputation ?? 0);
    const postCount = account.post_count ?? 0;
    const applyNoIndex = reputationScore < NOINDEX_REPUTATION_THRESHOLD || postCount <= 3;
    // Paginated archive pages stay out of the index but must let crawlers walk
    // the pager links (noindex, FOLLOW). Page 1 keeps the reputation-based rule.
    const robots = isPaginated
      ? "noindex, follow"
      : applyNoIndex
        ? "noindex, nofollow"
        : undefined;

    return {
      title: metaTitle,
      description: metaDescription,
      robots,
      alternates: {
        canonical: `${base}${metaUrl}`,
        ...(rssSections.includes(section) &&
          !isPaginated && {
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
