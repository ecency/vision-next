"use client";

import { useGlobalStore } from "@/core/global-store";
import { Entry } from "@/entities";
import { EntryPageNsfwWarning } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-nsfw-warning";
import React from "react";

interface Props {
  entry: Entry;
  showIfNsfw: boolean;
  children: React.ReactNode;
}

export function EntryPageNsfwRevealing({ entry, showIfNsfw, children }: Props) {
  const globalNsfw = useGlobalStore((s) => s.nsfw);

  const showNsfwWarning =
      entry.json_metadata &&
      Array.isArray(entry.json_metadata.tags) &&
      entry.json_metadata.tags.includes("nsfw") &&
      !showIfNsfw &&
      !globalNsfw;

  return showNsfwWarning ? <EntryPageNsfwWarning /> : children;
}
