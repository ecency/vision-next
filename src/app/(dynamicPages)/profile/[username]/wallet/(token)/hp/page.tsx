import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../../../_helpers";
import { HpPage } from "./_page";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "wallet");
}

export default function Page() {
  return <HpPage />;
}
