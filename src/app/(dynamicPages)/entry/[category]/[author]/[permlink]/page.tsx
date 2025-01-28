import { getAccountFullQuery, getDeletedEntryQuery, getPostQuery } from "@/api/queries";
import {
  DeletedPostScreen,
  EntryPageContent,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  MdHandler,
  ReadTime
} from "./_components";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "../../../_helpers";

interface Props {
  params: Promise<{ author: string; permlink: string; category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { author, permlink } = await props.params;
  return generateEntryMetadata(author.replace("%40", ""), permlink);
}

export default async function EntryPage({ params, searchParams }: Props) {
  const { author: username, permlink, category } = await params;
  const isEdit = (await searchParams)["edit"];

  const author = username.replace("%40", "");
  const entry = await getPostQuery(author, permlink).prefetch();
  await getAccountFullQuery(entry?.author).prefetch();

  if (!entry) {
    const deletedEntry = await getDeletedEntryQuery(author, permlink).prefetch();
    if (deletedEntry) {
      return (
        <EntryPageContextProvider>
          <div className="app-content entry-page">
            <div className="the-entry">
              <DeletedPostScreen
                deletedEntry={deletedEntry}
                username={author}
                permlink={permlink}
              />
            </div>
          </div>
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
          <ReadTime entry={entry} />

          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            <span itemScope={true} itemType="http://schema.org/Article">
              <EntryPageContent
                category={category}
                isEdit={isEdit === "true" ?? false}
                entry={entry}
                rawParam={isEdit ?? ""}
              />
            </span>
          </div>
        </div>
        <EntryPageEditHistory entry={entry} />
      </EntryPageContextProvider>
    </HydrationBoundary>
  );
}
