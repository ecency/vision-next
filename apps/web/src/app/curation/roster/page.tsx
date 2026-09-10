import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { CurationRosterView } from "@/features/curation-desk/curation-roster-view";

export async function generateMetadata(props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("curation");
}

export default function CurationRosterPage() {
  return <CurationRosterView />;
}
