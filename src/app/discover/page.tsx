import "./page.scss";
import { Metadata, ResolvingMetadata } from "next";
import { getContributorsQuery } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { PagesMetadataGenerator } from "@/features/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("discover");
}

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function Discover({ searchParams }: Props) {
  await getContributorsQuery().prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div className="app-content discover-page"></div>
    </HydrationBoundary>
  );
}
