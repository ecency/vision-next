import { SimilarEntries } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries";
import { Entry } from "@/entities";

interface Props {
  entry: Entry;
}

export function EntryPageSimilarEntries({ entry }: Props) {
  const isComment = !!entry.parent_author;

  return !isComment ? <SimilarEntries entry={entry} /> : <></>;
}
