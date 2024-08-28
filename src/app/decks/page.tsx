import { DecksPage } from "@/app/decks/_page";
import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { EcencyConfigManager } from "@/config";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("decks");
}

export default EcencyConfigManager.withConditionalComponent(
  ({ visionFeatures }) => visionFeatures.decks.enabled,
  () => <DecksPage />,
  () => notFound()
);
