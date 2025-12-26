"use client";

import { Entry } from "@ecency/sdk";
import { useMemo, useState } from "react";
import { BlogDiscussionItem } from "./blog-discussion-item";

interface Props {
  discussionList: Entry[];
  parent: Entry;
  root: Entry;
  isRawContent?: boolean;
}

export function BlogDiscussionList({
  discussionList,
  parent,
  root,
  isRawContent,
}: Props) {
  const filtered = useMemo(
    () =>
      discussionList.filter(
        (x) => x.parent_author === parent.author && x.parent_permlink === parent.permlink
      ),
    [discussionList, parent]
  );

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {filtered.map((comment) => (
        <BlogDiscussionItem
          key={`${comment.author}/${comment.permlink}`}
          entry={comment}
          discussionList={discussionList}
          root={root}
          isRawContent={isRawContent}
        />
      ))}
    </div>
  );
}

