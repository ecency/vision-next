import { PagesMetadataGenerator } from "@/features/metadata";
import { Metadata, ResolvingMetadata } from "next";
import { ChatsClient } from "./_components/chats-client";
import { ChatsPageClient } from "./_components/chats-page-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  _props: unknown,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("chats");
}

export default function Chats() {
  return (
    <>
      <div className="md:hidden">
        <ChatsClient />
      </div>
      <div className="hidden h-full md:block">
        <ChatsPageClient />
      </div>
    </>
  );
}
