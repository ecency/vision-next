"use client";

import { getPostTipsQuery } from "@/api/queries";
import { Entry } from "@/entities";
import { useActiveAccount } from "@/core/hooks/use-active-account";
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
  const { activeUser } = useActiveAccount();
  const { data: _postTips } = getPostTipsQuery(
    entry.author,
    entry.permlink,
    !!activeUser
  ).useClientQuery();

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
