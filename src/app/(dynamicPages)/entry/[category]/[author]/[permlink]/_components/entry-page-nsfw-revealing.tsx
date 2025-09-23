"use client";

import { useGlobalStore } from "@/core/global-store";
import { Entry } from "@/entities";
import { EntryPageNsfwWarning } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-nsfw-warning";
import { NoSSRWrapper } from "./no-ssr-wrapper";
import React from "react";

interface Props {
  entry: Entry;
  showIfNsfw: boolean;
  children: React.ReactNode;
}

export function EntryPageNsfwRevealing({ entry, showIfNsfw, children }: Props) {
  const globalNsfw = useGlobalStore((s) => s.nsfw);

  const showNsfwWarning =
      Array.isArray(entry.json_metadata?.tags) &&
      entry.json_metadata?.tags.includes("nsfw") &&
      !showIfNsfw &&
      !globalNsfw;

  return (
    <NoSSRWrapper fallback={children}>
      {showNsfwWarning ? <EntryPageNsfwWarning /> : children}
    </NoSSRWrapper>
  );
}
