import { getAccountFullQuery, getDeletedEntryQuery, getPostQuery } from "@/api/queries";
import {
  DeletedPostScreen,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  MdHandler,
  ReadTime
} from "./_components";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "../../../_helpers";
import {
  EntryPageContentSSR
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import {
  EntryPageContentClient
} from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";

interface Props {
  params: Promise<{ author: string; permlink: string; category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(
    props: Props,
    _parent: ResolvingMetadata
): Promise<Metadata> {
  const { author, permlink } = await props.params;
  return generateEntryMetadata(author.replace("%40", ""), permlink);
}

export default async function EntryPage({ params, searchParams }: Props) {
  const { author: username, permlink, category } = await params;

  const search = await searchParams;
  const isEdit = search["edit"];

  const author = username.replace("%40", "");
  const entry = await getPostQuery(author, permlink).prefetch();

  if (
      permlink.startsWith("wave-") ||
      (permlink.startsWith("re-ecencywaves-") && entry?.parent_author === "ecency.waves")
  ) {
    return redirect(`/waves/${author}/${permlink}`);
  }

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
              <span itemScope itemType="http://schema.org/Article">
                <EntryPageContentSSR entry={entry} />
                <EntryPageContentClient
                    entry={entry}
                    rawParam={isEdit ?? ""}
                    isEdit={isEdit === "true"}
                    category={category}
                />
              </span>
            </div>
          </div>
          <EntryPageEditHistory entry={entry} />
        </EntryPageContextProvider>
      </HydrationBoundary>
  );
}
