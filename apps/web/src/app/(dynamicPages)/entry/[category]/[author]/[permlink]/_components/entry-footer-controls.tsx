"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

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
import { useContext, useMemo, useRef, useCallback } from "react";
import { useDistanceDetector } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/distance-detector";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { Button } from "@ui/button";
import { UilAlignAlt } from "@tooni/iconscout-unicons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getPostTipsQuery } from "@/api/queries";

interface Props {
  entry: Entry;
}

export function EntryFooterControls({ entry }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { showProfileBox, setShowProfileBox, setIsRawContent, isRawContent } =
    useContext(EntryPageContext);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleRaw = useCallback(() => {
    const next = !isRawContent;
    setIsRawContent(next);
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set("raw", "");
    } else {
      params.delete("raw");
    }
    const qs = params.toString().replace(/=(&|$)/g, "$1");
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [isRawContent, pathname, router, searchParams, setIsRawContent]);

  const { activeUser } = useActiveAccount();
  const isOwnEntry = useMemo(
    () => activeUser?.username === entry.author,
    [activeUser?.username, entry.author]
  );

  const { data: postTips } = getPostTipsQuery(entry.author, entry.permlink).useClientQuery();

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
        {!isOwnEntry && <EntryReblogBtn entry={entry} />}
        <EntryTipBtn entry={entry} postTips={postTips} />
      </div>
      <span className="flex-spacer" />
      <div className="flex items-center">
        <Tooltip content={i18next.t("entry.raw")}>
          <Button
            size="sm"
            appearance="gray-link"
            onClick={toggleRaw}
            icon={<UilAlignAlt />}
          />
        </Tooltip>
        <BookmarkBtn entry={entry} />
        <div className="border-l border-[--border-color] h-6 mx-4 w-[1px]" />
        <EntryMenu entry={entry} alignBottom={true} separatedSharing={true} />
      </div>
    </div>
  );
}
export default EntryFooterControls;
