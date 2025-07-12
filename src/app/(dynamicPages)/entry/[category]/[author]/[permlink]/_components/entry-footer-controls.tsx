"use client";

import i18next from "i18next";
import {
  BookmarkBtn,
  EntryMenu,
  EntryPayout,
  EntryReblogBtn,
  EntryTipBtn,
  EntryVoteBtn,
  EntryVotes
} from "@/features/shared";
import { Entry } from "@/entities";
import { Tooltip } from "@ui/tooltip";
import { useGlobalStore } from "@/core/global-store";
import { useContext, useMemo, useRef } from "react";
import { useDistanceDetector } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/distance-detector";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { useRouter } from "next/navigation";
import { Button } from "@ui/button";
import { UilAlignAlt } from "@tooni/iconscout-unicons-react";
import {
  useEffectiveEntry
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/use-effective-entry";

interface Props {
  entry: Entry;
}

export function EntryFooterControls({ entry }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    showProfileBox,
    setShowProfileBox,
    showWordCount,
    setShowWordCount,
    setIsRawContent,
    isRawContent
  } = useContext(EntryPageContext);

  const effectiveEntry = useEffectiveEntry(entry);
  const activeUser = useGlobalStore((s) => s.activeUser);
  const isOwnEntry = useMemo(
    () => activeUser?.username === effectiveEntry.author,
    [activeUser?.username, effectiveEntry.author]
  );

  useDistanceDetector(ref, showProfileBox, showWordCount, setShowProfileBox, setShowWordCount);

  return (
    <div
      className="entry-controls text-sm flex-wrap gap-4 [&_.entry-tip-btn]:mr-0 [&_.entry-reblog-btn]:!mr-0"
      ref={ref}
    >
      <div className="flex items-center gap-4">
        <EntryVoteBtn isPostSlider={true} entry={effectiveEntry} />
        <EntryPayout entry={effectiveEntry} />
        <EntryVotes entry={effectiveEntry} />
        <EntryTipBtn entry={effectiveEntry} />
        {!isOwnEntry && <EntryReblogBtn entry={effectiveEntry} />}
      </div>
      <span className="flex-spacer" />
      <div className="flex items-center">
        <Tooltip content={i18next.t("entry.raw")}>
          <Button
            size="sm"
            appearance="gray-link"
            onClick={() => setIsRawContent(!isRawContent)}
            icon={<UilAlignAlt />}
          />
        </Tooltip>
        <BookmarkBtn entry={effectiveEntry} />
        <div className="border-l border-[--border-color] h-6 mx-4 w-[1px]" />
        <EntryMenu
          entry={effectiveEntry}
          alignBottom={true}
          separatedSharing={true}
          toggleEdit={() => {
            if (typeof effectiveEntry.parent_author === "string") {
              // It will trigger in-place editor
              router.push(`/${effectiveEntry.category}/@${effectiveEntry.author}/${effectiveEntry.permlink}?edit=true`);
            } else {
              router.push(`/${effectiveEntry.url}/edit`);
            }
          }}
        />
      </div>
    </div>
  );
}
export default EntryFooterControls;
