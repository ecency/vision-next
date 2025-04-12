"use client";

import { Entry } from "@/entities";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { EntryPageEdit } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-edit";
import { SelectionPopover } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/selection-popover";
import { EntryPageViewerManager } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-viewer-manager";
import { PostContentRenderer } from "@/features/shared";

interface Props {
  entry: Entry;
  rawParam: string;
  isEdit: boolean;
}

export function EntryPageBodyViewer({ entry, rawParam, isEdit }: Props) {
  const postPoll = useEntryPollExtractor(entry);

  const preparedEntryBody = entry.body.replace(/<a id="/g, '<a data-id="');

  return (
    <EntryPageViewerManager entry={entry}>
      {!isEdit && (
        <>
          <SelectionPopover postUrl={entry.url}>
            <PostContentRenderer value={preparedEntryBody} />
            {postPoll && (
              <div className="pb-6">
                <PollWidget entry={entry} poll={postPoll} isReadOnly={false} />
              </div>
            )}
          </SelectionPopover>
        </>
      )}
      <EntryPageEdit entry={entry} isEdit={isEdit} />
    </EntryPageViewerManager>
  );
}
