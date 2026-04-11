"use client";

import React, { useContext } from "react";
import { Entry } from "@/entities";
import { EntryPageNsfwRevealing } from "./entry-page-nsfw-revealing";
import { EntryPageContext } from "./context";

interface Props {
  entry: Entry;
  children: React.ReactNode;
}

export function EntryPageNsfwBodyWrapper({ entry, children }: Props) {
  const { showIfNsfw } = useContext(EntryPageContext);

  return (
    <EntryPageNsfwRevealing entry={entry} showIfNsfw={showIfNsfw}>
      {children}
    </EntryPageNsfwRevealing>
  );
}
