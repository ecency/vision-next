"use client";

import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { PropsWithChildren, useContext } from "react";
import { Entry } from "@/entities";

export function EntryPageViewerManager(props: PropsWithChildren<{ entry: Entry }>) {
  const { isRawContent } = useContext(EntryPageContext);

  if (isRawContent) {
    return (
        <pre className="entry-body markdown-view user-selectable font-mono bg-gray-100 rounded text-sm !p-4 dark:bg-gray-900">
      {props.entry.body}
    </pre>
    );
  }

  return props.children;
}
