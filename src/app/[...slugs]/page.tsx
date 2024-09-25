import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { CommunityPage } from "@/app/[...slugs]/_community-page";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { EntryIndex } from "@/app/[...slugs]/_index";
import { EntryPage } from "@/app/[...slugs]/_entry-page";
import { EntryEditPage } from "@/app/[...slugs]/_entry-edit-page";
import { Metadata, ResolvingMetadata } from "next";
import { MetadataGenerator, PageDetector } from "@/app/[...slugs]/_utils";
import { getDynamicPropsQuery } from "@/api/queries";

interface Props {
  params: { slugs: string[] };
  searchParams: Record<string, string | undefined>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return MetadataGenerator.build(props, parent);
}

export default async function FilteredOrCategorizedPage({
  params: { slugs },
  searchParams
}: Props) {
  const page = PageDetector.detect({ params: { slugs } });
  await getDynamicPropsQuery().prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      {page === "index" && <EntryIndex filter={slugs[0]} tag={slugs[1] ?? ""} />}
      {page === "feed" && <EntryIndex filter={slugs[1]} tag={slugs[0].replace("%40", "@")} />}
      {page === "entry" && (
        <EntryPage
          category={slugs[0]}
          username={slugs[1].replace("%40", "").replace("@", "")}
          permlink={slugs[2]}
          isEdit={slugs[3] === "edit"}
          searchParams={searchParams}
        />
      )}
      {page === "edit" && (
        <EntryEditPage
          username={slugs[0].replace("%40", "").replace("@", "")}
          permlink={slugs[1]}
        />
      )}
      {page === "community" && (
        <CommunityPage
          searchParams={searchParams}
          params={{
            filterOrCategory: slugs[0],
            entryOrCommunity: slugs[1]
          }}
        />
      )}
    </HydrationBoundary>
  );
}
