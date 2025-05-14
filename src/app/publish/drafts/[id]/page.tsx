import { PagesMetadataGenerator } from "@/features/metadata";
import Draft from "./_page";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("draft");
}

export default function DraftPage() {
  return <Draft />;
}
