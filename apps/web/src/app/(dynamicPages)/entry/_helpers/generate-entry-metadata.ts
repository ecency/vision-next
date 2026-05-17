import { parseDate, safeDecodeURIComponent, truncate } from "@/utils";
import { entryCanonical } from "@/utils/entry-canonical";
import { isIndexable, ReputationSource } from "@/utils/entry-indexability";
import { catchPostImage, postBodySummary, isValidPermlink } from "@ecency/render-helper";
import { Metadata } from "next";
import { getContentQueryOptions, getProfilesQueryOptions } from "@ecency/sdk";
import { prefetchQuery } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { getServerAppBase } from "@/utils/server-app-base";

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

    // Source from condenser_api.get_content first: it returns root_author /
    // root_permlink (needed to canonical replies to their discussion root and
    // to detect container/wave trees), which bridge.get_post omits. This is
    // fetch-count-neutral — bridge is the fallback, already trusted here.
    let entry = null;
    try {
      entry = await prefetchQuery(getContentQueryOptions(cleanAuthor, cleanPermlink));
    } catch (e) {
      console.warn("generateEntryMetadata: get_content failed, trying bridge", e);
    }

    if (!entry || !entry.body || !entry.created) {
      entry = await prefetchQuery(
        EcencyEntriesCacheManagement.getEntryQueryByPath(cleanAuthor, cleanPermlink)
      );
      if (!entry || !entry.body || !entry.created) {
        console.warn("generateEntryMetadata: both content sources failed", {
          username,
          permlink: cleanPermlink
        });
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

    const robots = isIndexable(entry, authorAccount, accountFetchFailed)
      ? undefined
      : "noindex, nofollow";

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
