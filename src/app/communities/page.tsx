import { PagesMetadataGenerator } from "@/features/metadata";
import { getCommunitiesQueryOptions } from "@ecency/sdk";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { CommunitiesList } from "./_components";
import "./page.scss";
import { getQueryClient } from "@/core/react-query";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("communities");
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Communities({ searchParams }: Props) {
  const { sort, q } = await searchParams;

  await getQueryClient().prefetchQuery(getCommunitiesQueryOptions(sort ?? "rank", q ?? ""));

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <CommunitiesList query={q ?? ""} sort={sort ?? "rank"} />
    </HydrationBoundary>
  );
}
