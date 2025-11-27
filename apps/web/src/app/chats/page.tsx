import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { ChatsPageClient } from "./_components/chats-page-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  _props: unknown,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("chats");
}

export default function Chats() {
  return <ChatsPageClient />;
}
