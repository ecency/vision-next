import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { InvitedSponsorPage } from "./_page";

interface Props {
  params: Promise<{ hash: string }>;
}

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("onboard-friend");
}

export default async function Page(props: Props) {
  const { hash } = await props.params;
  return <InvitedSponsorPage hash={hash} />;
}
