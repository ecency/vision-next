import React from "react";
import { Entry } from "@/entities";
import { PostContentRenderer } from "@/features/shared";

interface Props {
  entry: Entry;
  isRawContent: boolean;
}

export function DiscussionItemBody({ entry, isRawContent }: Props) {

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
