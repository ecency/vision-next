import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { EntryIndex } from "@/app/[...slugs]/_index";
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
      {page === "edit" && (
        <EntryEditPage
          username={slugs[0].replace("%40", "").replace("@", "")}
          permlink={slugs[1]}
        />
      )}
      <div className="pt-16">still here</div>
    </HydrationBoundary>
  );
}
