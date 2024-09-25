import { SubmitWithProvidersPage } from "@/app/submit/_page";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "@/app/(dynamicPages)/entry/_helpers";

interface Props {
  params: { author: string; permlink: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const meta = await generateEntryMetadata(
    props.params.author.replace("%40", ""),
    props.params.permlink
  );
  return {
    ...meta,
    title: `Edit – ${meta.title}`
  };
}

export function EntryEditPage({ params: { author: username, permlink } }: Props) {
  return (
    <SubmitWithProvidersPage
      path={`@${username}/${permlink}/edit`}
      permlink={permlink}
      username={username}
    />
  );
}
