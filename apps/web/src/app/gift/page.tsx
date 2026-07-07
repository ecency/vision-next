import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata } from "next";
import { GiftPage } from "./_page";

export async function generateMetadata(): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("gift");
}

export default function Page() {
  return <GiftPage />;
}
