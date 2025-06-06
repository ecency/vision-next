import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { PointsPage } from "./_page";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = await PagesMetadataGenerator.getForPage("perks");
  return {
    ...metadata,
    title: "Points | " + metadata.title
  };
}

export default function Page() {
  return <PointsPage />;
}
