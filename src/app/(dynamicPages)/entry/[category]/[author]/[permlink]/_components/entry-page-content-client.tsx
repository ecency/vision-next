"use client";

import { Entry } from "@/entities";
import { EntryPageBodyViewer } from "./entry-page-body-viewer";
import { EntryPageStaticBody } from "./entry-page-static-body";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { EntryPageEditHistory } from "./entry-page-edit-history";
import { useContext } from "react";
import { EntryPageContext } from "./context";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import ClientEntryPageNsfwRevealing from "./client-entry-page-nsfwrevealing";

interface Props {
  entry: Entry;
  category: string;
}

export function EntryPageContentClient({ entry, category }: Props) {
  const { showIfNsfw, isRawContent } = useContext(EntryPageContext);
  const postPoll = useEntryPollExtractor(entry);

  return (
    <>
      <ClientEntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
        {/* Client-side post body rendering that replaces SSR content */}
        {!isRawContent && (
          <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-4">
            <EntryPageStaticBody entry={entry} />
            {postPoll && <PollWidget entry={entry} poll={postPoll} isReadOnly={false} />}
          </div>
        )}
        <EntryPageBodyViewer entry={entry} />
      </ClientEntryPageNsfwRevealing>
      <EntryPageDiscussions category={category} entry={entry} />
      <EntryPageEditHistory entry={entry} />
    </>
  );
}
