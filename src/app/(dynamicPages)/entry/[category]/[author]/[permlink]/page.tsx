import { getAccountFullQuery, getDeletedEntryQuery, getPostQuery } from "@/api/queries";
import {
  DeletedPostScreen,
  EntryBodyExtra,
  EntryPageContent,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  EntryPageLoadingScreen,
  MdHandler,
  ReadTime
} from "./_components";
import { getQueryClient } from "@/core/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "../../../_helpers";

interface Props {
  params: { author: string; permlink: string; category: string };
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateEntryMetadata(props.params.author.replace("%40", ""), props.params.permlink);
}

export default async function EntryPage({
  params: { author: username, permlink, category },
  searchParams
}: Props) {
  const author = username.replace("%40", "");
  const entry = await getPostQuery(author, permlink).prefetch();
  await getAccountFullQuery(entry?.author).prefetch();

  if (!entry) {
    const deletedEntry = await getDeletedEntryQuery(author, permlink).prefetch();
    if (deletedEntry) {
      return (
        <EntryPageContextProvider>
          <DeletedPostScreen deletedEntry={deletedEntry} username={author} permlink={permlink} />
        </EntryPageContextProvider>
      );
    }

    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
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
    </HydrationBoundary>
  );
}
