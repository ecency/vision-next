import { SimilarEntries } from "@/app/[...slugs]/_entry-components/similar-entries";
import { Entry } from "@/entities";

interface Props {
  entry: Entry;
}

export function EntryPageSimilarEntries({ entry }: Props) {
  const isComment = !!entry.parent_author;

  return !isComment ? <SimilarEntries entry={entry} /> : <></>;
}