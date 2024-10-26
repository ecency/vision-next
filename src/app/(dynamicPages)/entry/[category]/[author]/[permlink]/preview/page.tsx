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
import { useTitle } from "react-use";
import { Alert } from "@ui/alert";
import i18next from "i18next";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import { useRouter } from "next/navigation";
import { makeEntryPath } from "@/utils";
import { useEffect, useState } from "react";

interface Props {
  params: { author: string; permlink: string; category: string };
  searchParams: Record<string, string | undefined>;
}

export default function PreviewPage({
  params: { author: username, permlink, category },
  searchParams
}: Props) {
  const [attempted, setAttempted] = useState(false);
  const router = useRouter();

  const { data: entry, refetch } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    username.replace("%40", ""),
    permlink
  ).useClientQuery();

  useTitle(entry?.title ?? "Post preview");

  useEffect(() => {
    if (!entry) {
      refetch().then((r) => setAttempted(true));
    } else {
      setTimeout(
        () => router.push(makeEntryPath(entry.category, entry.author, entry.permlink)),
        3000
      );
    }
  }, [entry, refetch, router]);

  useEffect(() => {
    if (attempted && !entry) {
      router.push("/not-found");
    }
  }, [attempted, entry, router]);

  return (
    <EntryPageContextProvider>
      <MdHandler />

      <div className="app-content entry-page">
        <EntryPageLoadingScreen />
        {entry && <ReadTime entry={entry} />}

        <div className="the-entry">
          {!entry && (
            <Alert appearance="warning" className="flex items-start gap-2">
              <UilSpinner className="w-6 h-6 animate-spin" />
              <div>
                <h4 className="font-bold">{i18next.t("entry-preview.searching-title")}</h4>
                <p>{i18next.t("entry-preview.searching-description")}</p>
              </div>
            </Alert>
          )}

          {entry && (
            <>
              <Alert appearance="warning" className="flex items-start gap-2">
                <UilSpinner className="w-6 h-6 animate-spin" />
                <div>
                  <h4 className="font-bold">{i18next.t("entry-preview.title")}</h4>
                  <p>{i18next.t("entry-preview.description")}</p>
                </div>
              </Alert>
              <EntryPageCrossPostHeader entry={entry} />
              <span itemScope={true} itemType="http://schema.org/Article">
                <EntryPageContent
                  category={category}
                  isEdit={false}
                  entry={entry}
                  rawParam={searchParams["raw"] ?? ""}
                />
              </span>
            </>
          )}
        </div>
      </div>
      {entry && <EntryPageEditHistory entry={entry} />}
      {entry && <EntryBodyExtra entry={entry} />}
    </EntryPageContextProvider>
  );
}
