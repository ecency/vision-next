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
        <pre
          className="bg-gray-50 rounded p-4 text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto"
          style={{ color: "rgba(0, 0, 0, 0.84)" }}
        >
          {entryData.body}
        </pre>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="markdown-body text-sm! max-w-none">
        <MemoEcencyRenderer value={entryData.body} />
      </div>
    </div>
  );
}
