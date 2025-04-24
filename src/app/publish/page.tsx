import "./page.scss";

import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import Publish from "./_page";

export async function generateMetadata(parent: ResolvingMetadata): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("submit");
}

export default function PublishPage() {
  return <Publish />;
}
