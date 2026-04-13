import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { AiGeneratorPage } from "./_page";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = await PagesMetadataGenerator.getForPage("perks");
  return {
    ...metadata,
    title: "AI Image Generator | " + metadata.title
  };
}

export default function Page() {
  return <AiGeneratorPage />;
}
