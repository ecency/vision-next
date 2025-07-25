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

interface Props {
  entry: Entry;
}

export function EntryFooterControls({ entry }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { showProfileBox, setShowProfileBox, setIsRawContent, isRawContent } =
    useContext(EntryPageContext);

  const activeUser = useGlobalStore((s) => s.activeUser);
  const isOwnEntry = useMemo(
    () => activeUser?.username === entry.author,
    [activeUser?.username, entry.author]
  );

  useDistanceDetector(ref, showProfileBox, setShowProfileBox);

  return (
    <div
      className="entry-controls p-2 md:p-3 text-sm flex-wrap gap-4 [&_.entry-tip-btn]:mr-0 [&_.entry-reblog-btn]:!mr-0"
      ref={ref}
    >
      <div className="flex items-center gap-4">
        <EntryVoteBtn isPostSlider={true} entry={entry} />
        <EntryPayout entry={entry} />
        <EntryVotes entry={entry} />
        <EntryTipBtn entry={entry} />
        {!isOwnEntry && <EntryReblogBtn entry={entry} />}
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
        <BookmarkBtn entry={entry} />
        <div className="border-l border-[--border-color] h-6 mx-4 w-[1px]" />
        <EntryMenu
          entry={entry}
          alignBottom={true}
          separatedSharing={true}
          toggleEdit={() => {
            if (typeof entry.parent_author === "string") {
              // It will trigger in-place editor
              router.push(`/${entry.category}/@${entry.author}/${entry.permlink}?edit=true`);
            } else {
              router.push(`/${entry.url}/edit`);
            }
          }}
        />
      </div>
    </div>
  );
}
export default EntryFooterControls;
