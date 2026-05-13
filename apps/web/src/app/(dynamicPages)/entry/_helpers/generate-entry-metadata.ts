import { accountReputation, parseDate, safeDecodeURIComponent, truncate } from "@/utils";
import { entryCanonical } from "@/utils/entry-canonical";
import { isNsfwEntry } from "@/utils/nsfw-detection";
import { catchPostImage, postBodySummary, isValidPermlink } from "@ecency/render-helper";
import { Metadata } from "next";
import { getContentQueryOptions, getProfilesQueryOptions, Profile } from "@ecency/sdk";
import { prefetchQuery } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { getServerAppBase } from "@/utils/server-app-base";
import { FullAccount } from "@/entities";

const NOINDEX_REPUTATION_THRESHOLD = 40;

type ReputationSource = Pick<FullAccount, "reputation" | "post_count"> | Profile | null;

const shouldApplyNoIndex = (
  account: ReputationSource,
  fallbackReputation: number
): boolean => {
  const reputationScore = accountReputation(account?.reputation ?? fallbackReputation ?? 0);
  const postCount = typeof account?.post_count === "number" ? account.post_count : 0;

  const meetsReputationGate = reputationScore < NOINDEX_REPUTATION_THRESHOLD;
  const lacksPostingHistory = postCount <= 3;

  // Accounts are no-indexed when they lack reputation or meaningful posting history, regardless of age.
  return meetsReputationGate || lacksPostingHistory;
};


export async function generateEntryMetadata(
  username: string,
  permlink: string
): Promise<Metadata> {
  const cleanPermlink = safeDecodeURIComponent(permlink).trim();
  const base = await getServerAppBase();
  if (!username || !cleanPermlink || cleanPermlink === "undefined" || !isValidPermlink(cleanPermlink)) {
    // Only warn for plausible permlinks — skip file extensions (browser/extension source map requests)
    if (!/\.\w{2,4}$/.test(cleanPermlink)) {
      console.warn("generateEntryMetadata: Missing author or permlink", { username, permlink });
    }
    return {};
  }
  try {
    const cleanAuthor = username.replace("%40", "");
    let entry = await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(cleanAuthor, cleanPermlink));

    if (!entry || !entry.body || !entry.created) {
      console.warn("generateEntryMetadata: incomplete, trying fallback getContent", {
        username,
        permlink: cleanPermlink
      });
      try {
        // fallback to direct content API
        entry = await prefetchQuery(
          getContentQueryOptions(cleanAuthor, cleanPermlink)
        );
      } catch (e) {
        console.error("generateEntryMetadata: fallback getContent failed", cleanAuthor, cleanPermlink);
        return {};
      }

      if (!entry || !entry.body || !entry.created) {
        console.warn("generateEntryMetadata: fallback also failed", { username, permlink: cleanPermlink });
        return {};
      }
    }

    const isComment = !!entry.parent_author;

    let title = truncate(entry.title, 67);
    if (isComment) {
      const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
      title = `@${entry.author}: ${rawCommentTitle}`;
    }

    const summary =
      entry.json_metadata?.description || truncate(postBodySummary(entry.body, 210), 140);

    const image = catchPostImage(entry, 1200, 630, "match");
    // Bare /@author/permlink form — matches the new self-canonical so og:url
    // and rel=canonical agree, which is what Google expects to consolidate
    // duplicates onto a single URL.
    const fullUrl = `${base}/@${entry.author}/${entry.permlink}`;
    const authorUrl = `${base}/@${entry.author}`;
    const createdAt = parseDate(entry.created ?? new Date().toISOString());
    const updatedAt = parseDate(entry.updated ?? entry.last_update ?? entry.created ?? new Date().toISOString());
    const canonical = entryCanonical(entry, base);
    const finalCanonical = canonical ?? fullUrl;

    let authorAccount: ReputationSource = null;
    let accountFetchFailed = false;

    try {
      const profiles = await prefetchQuery(
        getProfilesQueryOptions([entry.author])
      );
      authorAccount = profiles?.[0] ?? null;
    } catch (e) {
      accountFetchFailed = true;
      console.warn("generateEntryMetadata: failed to load author account", e);
    }

    const nsfwNoIndex = isNsfwEntry(entry);
    const reputationNoIndex = !accountFetchFailed
      && shouldApplyNoIndex(authorAccount, entry.author_reputation ?? 0);
    const applyNoIndex = nsfwNoIndex || reputationNoIndex;

    const robots = applyNoIndex ? "noindex, nofollow" : undefined;

    return {
      title,
      description: `${summary} by @${entry.author}`,
      robots,
      openGraph: {
        title,
        description: summary,
        url: finalCanonical,
        images: image ? [image] : [],
        type: "article",
        publishedTime: createdAt.toISOString(),
        modifiedTime: updatedAt.toISOString(),
        locale: "en_US",
        siteName: "Ecency",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: summary,
        images: image ? [image] : [],
      },
      other: {
        "article:author": authorUrl,
        "og:updated_time": updatedAt.toISOString(),
      },
      alternates: {
        canonical: finalCanonical,
      },
    };
  } catch (e) {
    console.error("generateEntryMetadata failed:", e, { username, permlink: cleanPermlink });
    return {};
  }
}
