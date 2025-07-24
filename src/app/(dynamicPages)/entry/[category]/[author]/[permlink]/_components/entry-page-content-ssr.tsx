import { Entry } from "@/entities";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { useEntryLocation } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import Link from "next/link";
import { EntryFooterControls } from "./entry-footer-controls";
import { EntryFooterInfo } from "./entry-footer-info";
import { EntryPageIsCommentHeader } from "./entry-page-is-comment-header";
import { EntryPageMainInfo } from "./entry-page-main-info";
import { EntryPageProfileBox } from "./entry-page-profile-box";
import { EntryPageSimilarEntries } from "./entry-page-similar-entries";
import { EntryPageStaticBody } from "./entry-page-static-body";
import { EntryPageWarnings } from "./entry-page-warnings";
import { EntryTags } from "./entry-tags";

interface Props {
  entry: Entry;
}

export function EntryPageContentSSR({ entry }: Props) {
  const location = useEntryLocation(entry);
  const postPoll = useEntryPollExtractor(entry);
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
    mainEntityOfPage: `https://ecency.com${entry.url}`
  };
  return (
    <>
      <EntryPageProfileBox entry={entry} />
      <div className="entry-header">
        <EntryPageWarnings entry={entry} />
        <EntryPageIsCommentHeader entry={entry} />
        <h1 className="entry-title">{entry.title}</h1>
        <EntryPageMainInfo entry={entry} />
      </div>
      {/* SSR static body */}
      <EntryPageStaticBody entry={entry} />
      {postPoll && (
        <div className="pb-6">
          <PollWidget entry={entry} poll={postPoll} isReadOnly={false} />
        </div>
      )}
      <div className="entry-footer flex-wrap mb-4 lg:mb-8 border border-[--border-color] p-2 md:p-4 rounded-2xl">
        {location?.coordinates && (
          <Link
            href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
            target="_external"
            rel="noopener"
            className="text-sm mb-2 block"
          >
            <UilMapPinAlt className="w-4 h-4 mr-1" />
            {location.address}
          </Link>
        )}
        <EntryTags entry={entry} />
        <EntryFooterInfo entry={entry} />
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
