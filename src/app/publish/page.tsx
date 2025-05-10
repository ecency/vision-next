import { PagesMetadataGenerator } from "@/features/metadata";
import Publish from "./_page";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("submit");
}

export default function PublishPage() {
  return <Publish />;
}
