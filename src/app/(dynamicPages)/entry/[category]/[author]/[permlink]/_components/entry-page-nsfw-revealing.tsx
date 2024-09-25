"use client";

import { useGlobalStore } from "@/core/global-store";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { Entry } from "@/entities";
import { EntryPageNsfwWarning } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-nsfw-warning";
import { PropsWithChildren, useContext } from "react";

interface Props {
  entry: Entry;
}

export function EntryPageNsfwRevealing({ entry, children }: PropsWithChildren<Props>) {
  const globalNsfw = useGlobalStore((s) => s.nsfw);

  const { showIfNsfw } = useContext(EntryPageContext);

  const showNsfwWarning =
    (entry.json_metadata.tags?.includes("nsfw") ?? false) && !showIfNsfw && !globalNsfw;

  return showNsfwWarning ? <EntryPageNsfwWarning /> : children;
}
