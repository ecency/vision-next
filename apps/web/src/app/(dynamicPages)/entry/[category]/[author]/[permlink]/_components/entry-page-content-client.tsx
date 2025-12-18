"use client";

import { Entry } from "@/entities";
import { EntryPageBodyViewer } from "./entry-page-body-viewer";
import { EntryPageDiscussions } from "./entry-page-discussions";
import { EntryPageEditHistory } from "./entry-page-edit-history";
import { useContext } from "react";
import { EntryPageContext } from "./context";
import ClientEntryPageNsfwRevealing from "./client-entry-page-nsfwrevealing";

interface Props {
  entry: Entry;
  category: string;
}

export function EntryPageContentClient({ entry, category }: Props) {
  const { showIfNsfw } = useContext(EntryPageContext);

  return (
    <>
      <ClientEntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
        <EntryPageBodyViewer entry={entry} />
      </ClientEntryPageNsfwRevealing>
      <EntryPageDiscussions category={category} entry={entry} />
      <EntryPageEditHistory entry={entry} />
    </>
  );
}
