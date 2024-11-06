import "./page.scss";
import { CommunitiesList } from "./_components";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { getCommunitiesQuery } from "@/api/queries";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";

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
  await getCommunitiesQuery(sort ?? "rank", q ?? "").prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <CommunitiesList query={q ?? ""} sort={sort || "rank"} />
    </HydrationBoundary>
  );
}
