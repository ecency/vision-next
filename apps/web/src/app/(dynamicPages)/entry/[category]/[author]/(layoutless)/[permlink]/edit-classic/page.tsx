import { SubmitWithProvidersPage } from "@/app/submit/_page";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "@/app/(dynamicPages)/entry/_helpers";

interface Props {
  params: Promise<{ author: string; permlink: string; category: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { author, permlink } = await props.params;
  if (!permlink || permlink === "undefined") {
    return {};
  }
  const meta = await generateEntryMetadata(author.replace("%40", ""), permlink);
  return {
    ...meta,
    title: `Edit – ${meta?.title}`
  };
}

export default async function EntryEditPage({ params }: Props) {
  const { author: username, permlink } = await params;

  return (
    <SubmitWithProvidersPage
      path={`@${username.replace("%40", "")}/${permlink}/edit`}
      permlink={permlink}
      username={username.replace("%40", "")}
    />
  );
}
