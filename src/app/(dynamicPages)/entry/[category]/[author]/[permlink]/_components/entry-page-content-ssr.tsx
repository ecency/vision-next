import { Entry } from "@/entities";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { useEntryLocation, makeEntryPath } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import Link from "next/link";
import { EntryFooterControls } from "./entry-footer-controls";
import { EntryFooterInfo } from "./entry-footer-info";
import { EntryPageIsCommentHeader } from "./entry-page-is-comment-header";
import { EntryPageMainInfo } from "./entry-page-main-info";
import { EntryPageSimilarEntries } from "./entry-page-similar-entries";
import { EntryPageSSRBody } from "./entry-page-ssr-body";
import { EntryPageWarnings } from "./entry-page-warnings";
import { EntryTags } from "./entry-tags";

interface Props {
  entry: Entry;
  isRawContent?: boolean;
}

export function EntryPageContentSSR({ entry, isRawContent }: Props) {
  const location = useEntryLocation(entry);
  const postPoll = useEntryPollExtractor(entry);
  const path = makeEntryPath(entry.category, entry.author, entry.permlink);
  const isComment = !!entry.parent_author;
  const urlParts = path.split("#");
  const fullUrl =
    path !== "#"
      ? isComment && urlParts[1]
        ? `https://ecency.com/${urlParts[1]}`
        : `https://ecency.com${path}`
      : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    author: {
      "@type": "Person",
      name: entry.author,
      url: `https://ecency.com/@${entry.author}`
    },
    datePublished: entry.created,
    dateModified: entry.updated ?? entry.created,
    image: catchPostImage(entry, 600, 500, "match") ?? undefined,
    description: entry.json_metadata?.description || postBodySummary(entry.body, 140),
    mainEntityOfPage: fullUrl
  };
  return (
    <>
      <div className="entry-header">
        <EntryPageWarnings entry={entry} />
        <EntryPageIsCommentHeader entry={entry} />
        {!isComment && <h1 className=" px-2 lg:px-0 text-xl sm:text-2xl md:text-[32px] lg:text-[42px] !leading-[1.5] mt-4 mb-6 break-words !font-[var(--font-lora)]">
          {entry.title}
        </h1>
        }
        <EntryPageMainInfo entry={entry} />
      </div>
      {/* SSR static body */}
      {!isRawContent && (
        <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-4">
          <EntryPageSSRBody entry={entry} />
          {postPoll && <PollWidget entry={entry} poll={postPoll} isReadOnly={false} />}
        </div>
      )}
      {isRawContent && (
        <pre
          id="post-body"
          className="entry-body markdown-view user-selectable font-mono bg-gray-100 rounded text-sm !p-4 dark:bg-gray-900 whitespace-pre-wrap break-words"
        >
          {entry.body}
        </pre>
      )}
      <div className="entry-footer bg-white/80 dark:bg-dark-200/90 rounded-xl flex-wrap my-4 lg:mb-8">
        {location?.coordinates && (
          <Link
            href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
            target="_external"
            rel="noopener"
            className="text-sm block border-b border-[--border-color] p-2 md:p-3"
          >
            <UilMapPinAlt className="w-4 h-4 mr-1" />
            {location.address}
          </Link>
        )}
        <div className="border-b border-[--border-color] p-2 md:p-3">
          <EntryTags entry={entry} />
          <EntryFooterInfo entry={entry} />
        </div>
        <EntryFooterControls entry={entry} />
      </div>
      <EntryPageSimilarEntries entry={entry} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
