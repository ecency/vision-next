import { SubmitWithProvidersPage } from "@/app/submit/_page";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("submit");
}

export default async function SubmitPage(props: Props) {
  const searchParams = await props.searchParams;
  return (
    <SubmitWithProvidersPage
      permlink={undefined}
      username={undefined}
      draftId={undefined}
      path="/submit"
      searchParams={searchParams}
    />
  );
}
