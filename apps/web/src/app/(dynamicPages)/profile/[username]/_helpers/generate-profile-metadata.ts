import { Metadata } from "next";
import i18next from "i18next";
import defaults from "@/defaults";
import { getServerAppBase } from "@/utils/server-app-base";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { accountReputation, truncate } from "@/utils";

const NOINDEX_REPUTATION_THRESHOLD = 40;

export async function generateProfileMetadata(
  username: string,
  section = "posts",
  /** Cursor token ("author/permlink") when rendering an older archive page. */
  cursor?: string
): Promise<Metadata> {
  const account = await prefetchQuery(getAccountFullQueryOptions(username));
  if (account) {
    const base = await getServerAppBase();
    const cleanUsername = username.replace("@", "");
    // Brand ("| Ecency") is appended by the root title.template; keep this bare.
    const sectionLabel = section ? (section === "engine" ? "tokens" : section) : "";
    const metaTitle = `${account.profile?.name || account.name}'s ${sectionLabel}${
      cursor ? " - older posts" : ""
    }`
      .replace(/\s{2,}/g, " ")
      .trim();
    // Bio-first: the user's own about text is the most distinctive snippet we
    // have (feeds meta description + og/twitter cards verbatim); the section
    // prefix keeps each section's description unique. Fallback is section-aware
    // so wallet/followers/settings pages don't claim "posts". typeof guard:
    // profile is untrusted on-chain JSON, about can be a non-string.
    const displayName = account.profile?.name || account.name;
    const rawAbout = account.profile?.about;
    const about = typeof rawAbout === "string" ? rawAbout.replace(/\s+/g, " ").trim() : "";
    const contentSections = ["posts", "blog", "comments", "replies"];
    const metaDescription = about
      ? truncate(`${displayName}'s ${sectionLabel}: ${about}`, 160)
      : contentSections.includes(section)
        ? i18next.t("profile.page-description", { s: section, n: displayName, u: cleanUsername })
        : i18next.t("profile.page-description-generic", {
            n: displayName,
            s: sectionLabel,
            u: cleanUsername
          });
    const isPaginated = !!cursor;
    const baseUrl = `/@${cleanUsername}${section ? `/${section}` : ""}`;
    const metaUrl = isPaginated ? `${baseUrl}?before=${cursor}` : baseUrl;
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
        site: defaults.twitterHandle,
        title: metaTitle,
        description: metaDescription,
        images: [metaImage],
      },
    };
  }

  return {};
}
