'use client';

import { EcencyRenderer } from '@ecency/renderer';
import type { Entry } from '@ecency/sdk';
import { memo } from 'react';

const MemoEcencyRenderer = memo(EcencyRenderer);

interface Props {
  entry: Entry;
  isRawContent?: boolean;
}

export function BlogPostBody({ entry, isRawContent }: Props) {
  const entryData = entry.original_entry || entry;

  if (isRawContent) {
    return (
      <div className="mb-6 sm:mb-8">
        <pre className="bg-theme-secondary rounded p-3 sm:p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto text-theme-primary">
          {entryData.body}
        </pre>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8">
      <div className="markdown-body text-sm! max-w-none">
        <MemoEcencyRenderer value={entryData.body} />
      </div>
    </div>
  );
}
