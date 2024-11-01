import { Metadata, ResolvingMetadata } from "next";
import { PagesMetadataGenerator } from "@/features/metadata";
import { OnboardFriend } from "@/app/onboard-friend/[...slugs]/_page";

interface Props {
  params: Promise<{ slugs: string[] }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("onboard-friend");
}

export default async function Page(props: Props) {
  const params = await props.params;
  return <OnboardFriend params={params} />;
}
