import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { PromotePost } from "./_page";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = await PagesMetadataGenerator.getForPage("perks");
  return {
    ...metadata,
    title: "Promote | " + metadata.title
  };
}

export default function Page() {
  return <PromotePost />;
}
