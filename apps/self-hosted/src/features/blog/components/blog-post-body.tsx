"use client";

import { Entry } from "@ecency/sdk";
import { EcencyRenderer } from "@ecency/renderer";
import { memo } from "react";

const MemoEcencyRenderer = memo(EcencyRenderer);

interface Props {
  entry: Entry;
  isRawContent?: boolean;
}

export function BlogPostBody({ entry, isRawContent }: Props) {
  const entryData = entry.original_entry || entry;

  if (isRawContent) {
    return (
      <div className="mb-8">
        <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
          {entryData.body}
        </pre>
      </div>
    );
  }

  return (
    <div className="mb-8 prose prose-lg dark:prose-invert max-w-none">
      <MemoEcencyRenderer value={entryData.body} />
    </div>
  );
}

