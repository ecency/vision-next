import { SubmitWithProvidersPage } from "@/app/submit/_page";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
  const publishPage = (await cookies()).get("ecency_pub_page");
  if (publishPage?.value === "1.0") {
    return <SubmitWithProvidersPage path={`/draft/${id}`} draftId={id} />;
  } else {
    return redirect(`/publish/drafts/${id}`);
  }
}
