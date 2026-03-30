import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { FreeSignUp } from "./_page";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("signup");
}

export default function Page() {
  return <FreeSignUp />;
}
