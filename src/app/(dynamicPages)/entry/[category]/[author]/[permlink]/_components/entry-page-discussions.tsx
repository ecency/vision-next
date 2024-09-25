"use client";

import { Comment, Discussion } from "@/features/shared";
import i18next from "i18next";
import { Entry } from "@/entities";
import { useContext, useMemo, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { CommentEngagement } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/comment-engagement";
import { useSearchParams } from "next/navigation";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { createReplyPermlink, makeJsonMetaDataReply } from "@/utils";
import appPackage from "../../../../../../../../package.json";
import { useCreateReply } from "@/api/mutations";
import { EcencyEntriesCacheManagement, getCommunityCache } from "@/core/caches";
import { EcencyConfigManager } from "@/config";

interface Props {
  entry: Entry;
  category: string;
}

export function EntryPageDiscussions({ entry: initialEntry, category }: Props) {
  const params = useSearchParams();

  const { commentsInputRef, selection, setSelection } = useContext(EntryPageContext);

  const activeUser = useGlobalStore((s) => s.activeUser);

  const [isCommented, setIsCommented] = useState(false);

  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();
  const { data: community } = getCommunityCache(category).useClientQuery();
  const isRawContent = useMemo(
    () =>
      EcencyConfigManager.CONFIG.visionFeatures.entries.rawContent.enabled && !!params.get("raw"),
    [params]
  );

  const { mutateAsync: createReply, isPending: isCreateReplyLoading } = useCreateReply(
    entry,
    undefined,
    () => {
      setIsCommented(true);
    }
  );

  const replySubmitted = async (text: string) => {
    const permlink = createReplyPermlink(entry!.author);
    const tags = entry!.json_metadata.tags || ["ecency"];

    const response = await createReply({
      jsonMeta: makeJsonMetaDataReply(tags, appPackage.version),
      text,
      permlink,
      point: true
    });

    setSelection("");
    return response;
  };

  return (
    <>
      <Comment
        defText={selection}
        submitText={i18next.t("g.reply")}
        entry={entry!}
        onSubmit={replySubmitted}
        isCommented={isCommented}
        inProgress={isCreateReplyLoading}
        inputRef={commentsInputRef}
      />

      {activeUser && entry!.children === 0 && <CommentEngagement />}

      <Discussion
        parent={entry!}
        community={community!!}
        hideControls={false}
        isRawContent={isRawContent}
      />
    </>
  );
}
