"use client";

import {
  EntryBodyExtra,
  EntryPageContent,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  EntryPageLoadingScreen,
  MdHandler,
  ReadTime
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import useMount from "react-use/lib/useMount";
import { useTitle } from "react-use";

interface Props {
  params: { author: string; permlink: string; category: string };
  searchParams: Record<string, string | undefined>;
}

export default function PreviewPage({
  params: { author: username, permlink, category },
  searchParams
}: Props) {
  const { data: entry, refetch } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    username.replace("%40", ""),
    permlink
  ).useClientQuery();

  useTitle(entry?.title ?? "Post preview");

  useMount(() => {
    if (!entry) {
      refetch();
    }
  });

  if (!entry) {
    return <></>;
  }

  return (
    <EntryPageContextProvider>
      <MdHandler />

      <div className="app-content entry-page">
        <EntryPageLoadingScreen />
        <ReadTime entry={entry} />

        <div className="the-entry">
          <EntryPageCrossPostHeader entry={entry} />
          <span itemScope={true} itemType="http://schema.org/Article">
            <EntryPageContent
              category={category}
              isEdit={false}
              entry={entry}
              rawParam={searchParams["raw"] ?? ""}
            />
          </span>
        </div>
      </div>
      <EntryPageEditHistory entry={entry} />
      <EntryBodyExtra entry={entry} />
    </EntryPageContextProvider>
  );
}
