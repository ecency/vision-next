import { Entry } from "@/entities";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { useEntryLocation } from "@/utils";
import { UilMapPinAlt } from "@tooni/iconscout-unicons-react";
import Link from "next/link";
import { NewsletterGate } from "@/features/newsletter/runtime";
import { PostSubscribePrompt } from "@/features/newsletter/post-subscribe-prompt";
import { EntryFooterControls } from "./entry-footer-controls";
import { EntryFooterInfo } from "./entry-footer-info";
import { EntryPageIsCommentHeader } from "./entry-page-is-comment-header";
import { EntryPageMainInfo } from "./entry-page-main-info";
import { EntryPageStaticBody } from "./entry-page-static-body";
import { EntryPageWarnings } from "./entry-page-warnings";
import { EntryTags } from "./entry-tags";
import { EntryPageNsfwBodyWrapper } from "./entry-page-nsfw-body-wrapper";
import { EntryTranslateInline } from "@/features/shared/entry-translate/entry-translate-inline";

interface Props {
  entry: Entry;
  isRawContent?: boolean;
}

export function EntryPageContentSSR({ entry, isRawContent }: Props) {
  const location = useEntryLocation(entry);
  const postPoll = useEntryPollExtractor(entry);
  return (
    <>
      <div className="entry-header">
        <EntryPageWarnings entry={entry} />
        <EntryPageIsCommentHeader entry={entry} />
      </div>
      {/* Title, byline, meta strip and body share ONE surface: the article is a
          single object, so the break between headline and first paragraph is a
          hairline inside the card (see the meta strip's border-y in
          entry-page-main-info), never a card gap. Separate cards are reserved
          for what comes after the article — footer, related, comments. */}
      <div className="entry-article reading-surface border border-[--border-color] rounded-xl mt-2 lg:mt-4 mb-4 md:mb-6 lg:mb-8">
        <EntryPageMainInfo entry={entry} />
        {/* SSR static body - wrapped with NSFW check */}
        <EntryPageNsfwBodyWrapper entry={entry}>
          {!isRawContent && (
            <div className="px-3 md:px-4 py-3 md:py-4">
              <EntryTranslateInline entry={entry} />
              <EntryPageStaticBody entry={entry} />
              {postPoll && <PollWidget entry={entry} poll={postPoll} isReadOnly={false} />}
            </div>
          )}
          {isRawContent && (
            <pre
              id="post-body"
              className="entry-body markdown-view user-selectable font-mono bg-gray-100 rounded text-sm !p-4 dark:bg-gray-900 whitespace-pre-wrap break-words m-3 md:m-4"
            >
              {entry.body}
            </pre>
          )}
        </EntryPageNsfwBodyWrapper>
      </div>
      <div className="entry-footer reading-surface border border-[--border-color] rounded-xl flex-wrap my-4 lg:mb-8">
        {location?.coordinates && (
          <Link
            href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
            target="_external"
            rel="nofollow noopener"
            className="text-sm block border-b border-[--border-color] p-2 md:p-3"
          >
            <UilMapPinAlt className="size-4 mr-1" />
            {location.address}
          </Link>
        )}
        <div className="border-b border-[--border-color] p-2 md:p-3">
          <EntryTags entry={entry} />
          <EntryFooterInfo entry={entry} />
        </div>
        <EntryFooterControls entry={entry} />
        <NewsletterGate>
          <PostSubscribePrompt entry={entry} className="m-2 md:m-3" />
        </NewsletterGate>
      </div>
    </>
  );
}
