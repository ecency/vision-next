"use client";

import { Discussion } from "@/features/shared";
import { Entry } from "@/entities";
import {useContext, useMemo, useState} from "react";
import { CommentEngagement } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/comment-engagement";
import { useSearchParams } from "next/navigation";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { EntryReplySection } from "./entry-reply-section";
import { EcencyEntriesCacheManagement, getCommunityCache } from "@/core/caches";
import { EcencyConfigManager } from "@/config";
import { useClientActiveUser } from "@/api/queries";

interface Props {
  entry: Entry;
  category: string;
}

export function EntryPageDiscussions({ entry: initialEntry, category }: Props) {
  const params = useSearchParams();
  const { commentsInputRef } = useContext(EntryPageContext);
  const activeUser = useClientActiveUser();

  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();
  const { data: community } = getCommunityCache(category).useClientQuery();

  const isRawContent = useMemo(
      () =>
          EcencyConfigManager.CONFIG.visionFeatures.entries.rawContent.enabled && !!params?.get("raw"),
      [params]
  );
  const [hasComments, setHasComments] = useState(initialEntry.children > 0);

  if (!entry) return null;

  return (
      <>
        {activeUser && <EntryReplySection entry={entry} />}

        {activeUser && !hasComments && <CommentEngagement />}

        <Discussion
            parent={entry}
            community={community!}
            hideControls={false}
            isRawContent={isRawContent}
            onTopLevelCommentsChange={setHasComments}
        />
      </>
  );
}

export default EntryPageDiscussions;
