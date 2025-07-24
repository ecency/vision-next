"use client";

import { useClientActiveUser } from "@/api/queries";
import { CommentEngagement } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/comment-engagement";
import { EcencyConfigManager } from "@/config";
import { EcencyEntriesCacheManagement, getCommunityCache } from "@/core/caches";
import { Entry } from "@/entities";
import { Discussion } from "@/features/shared";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { EntryReplySection } from "./entry-reply-section";

interface Props {
  entry: Entry;
  category: string;
}

export function EntryPageDiscussions({ entry: initialEntry, category }: Props) {
  const params = useSearchParams();
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
    <div className="bg-white/80 rounded-xl p-2 md:p-3">
      {activeUser && <EntryReplySection entry={entry} />}

      {activeUser && !hasComments && <CommentEngagement />}

      <Discussion
        parent={entry}
        community={community!}
        hideControls={false}
        isRawContent={isRawContent}
        onTopLevelCommentsChange={setHasComments}
      />
    </div>
  );
}

export default EntryPageDiscussions;
