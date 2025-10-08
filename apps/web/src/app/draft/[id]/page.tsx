import { SubmitWithProvidersPage } from "@/app/submit/_page";
import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("submit");
}
export default async function DraftEditPage({ params }: Props) {
  const { id } = await params;
  return <SubmitWithProvidersPage path={`/draft/${id}`} draftId={id} />;
}
