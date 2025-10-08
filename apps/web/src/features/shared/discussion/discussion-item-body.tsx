import React from "react";
import { Entry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { PostContentRenderer } from "@/features/shared";

interface Props {
  entry: Entry;
  isRawContent: boolean;
}

export function DiscussionItemBody({ entry, isRawContent }: Props) {
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  return (
    <>
      {!isRawContent ? (
        <PostContentRenderer value={entry.body} className="!text-base" />
      ) : (
        <pre className="item-body markdown-view mini-markdown">{entry.body}</pre>
      )}
    </>
  );
}
