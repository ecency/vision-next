"use client";

import { useClientActiveUser } from "@/api/queries";
import { CommentEngagement } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/comment-engagement";
import { EcencyConfigManager } from "@/config";
import { EcencyEntriesCacheManagement, getCommunityCache } from "@/core/caches";
import { Entry, Community } from "@/entities";
import { Discussion } from "@/features/shared";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { EntryReplySection } from "./entry-reply-section";
import { isCommunity } from "@/utils";

interface Props {
  entry: Entry;
  category: string;
}

// simple runtime type guards
function isEntry(x: unknown): x is Entry {
  return !!x && typeof x === "object" && "author" in (x as any) && "permlink" in (x as any);
}
function isCommunityEntity(x: unknown): x is Community {
  return !!x && typeof x === "object" && "name" in (x as any);
}

export function EntryPageDiscussions({ entry: initialEntry, category }: Props) {
  const params = useSearchParams();
  const activeUser = useClientActiveUser();

  const { data: entryRaw } =
      EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();

  const communityCategory = useMemo(() => {
    if (isCommunity(category)) {
      return category;
    }
    if (isCommunity(initialEntry.category)) {
      return initialEntry.category;
    }
    return undefined;
  }, [category, initialEntry.category]);

  const { data: communityRaw } = getCommunityCache(communityCategory).useClientQuery();

  // ✅ pick a guaranteed Entry (cache hit or the initial one)
  const entry: Entry = isEntry(entryRaw) ? entryRaw : initialEntry;

  // ✅ only render Discussion once we have a proper Community
  const community = isCommunityEntity(communityRaw) ? communityRaw : null;

  const isRawContent = useMemo(
      () =>
          EcencyConfigManager.CONFIG.visionFeatures.entries.rawContent.enabled &&
          !!params?.get("raw"),
      [params]
  );
  const [hasComments, setHasComments] = useState(initialEntry.children > 0);

  return (
      <div className="bg-white/80 dark:bg-dark-200/90 rounded-xl p-2 md:p-3">
        {activeUser && <EntryReplySection entry={entry} />}

        {activeUser && !hasComments && <CommentEngagement />}

        <Discussion
            parent={entry}
            community={community}
            hideControls={false}
            isRawContent={isRawContent}
            onTopLevelCommentsChange={setHasComments}
        />
      </div>
  );
}

export default EntryPageDiscussions;
