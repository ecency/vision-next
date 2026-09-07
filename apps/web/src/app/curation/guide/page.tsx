import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { CurationGuide } from "@/features/curation-desk/curation-guide";
import { Theme } from "@/features/shared/theme";

/** Static, indexable, revalidated daily. */
export const revalidate = 86400;

export async function generateMetadata(props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("curation-guide");
}

/**
 * The one desk tab on the static cache tier: its document is shared at the
 * edge across visitors of the same auth class, so the theme class the root
 * layout rendered belongs to whoever filled the cache. <Theme /> reapplies
 * this visitor's own theme after hydration, as every other static page does;
 * without it a dark-theme curator opened the guide light.
 */
export default function CurationGuidePage() {
  return (
    <>
      <Theme />
      <CurationGuide />
    </>
  );
}
