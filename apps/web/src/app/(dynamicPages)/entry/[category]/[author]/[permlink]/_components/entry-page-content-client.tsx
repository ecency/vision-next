"use client";

import { Entry } from "@/entities";
import { EntryPageBodyViewer } from "./entry-page-body-viewer";

interface Props {
  entry: Entry;
}

export function EntryPageContentClient({ entry }: Props) {
  return <EntryPageBodyViewer entry={entry} />;
}
