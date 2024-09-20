"use client";

import { useGlobalStore } from "@/core/global-store";
import { EcencyClientServerBridge } from "@/core/client-server-bridge";
import { EntryPageContext } from "@/app/[...slugs]/_entry-components/context";
import { Entry } from "@/entities";
import { EntryPageNsfwWarning } from "@/app/[...slugs]/_entry-components/entry-page-nsfw-warning";
import { PropsWithChildren } from "react";

interface Props {
  entry: Entry;
}

export function EntryPageNsfwRevealing({ entry, children }: PropsWithChildren<Props>) {
  const globalNsfw = useGlobalStore((s) => s.nsfw);

  const { showIfNsfw } = EcencyClientServerBridge.useSafeContext(EntryPageContext);

  const showNsfwWarning =
    (entry.json_metadata.tags?.includes("nsfw") ?? false) && !showIfNsfw && !globalNsfw;

  return showNsfwWarning ? <EntryPageNsfwWarning /> : children;
}
