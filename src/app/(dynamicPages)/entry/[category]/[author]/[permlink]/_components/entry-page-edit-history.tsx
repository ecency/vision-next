"use client";

import { EditHistory } from "@/features/shared";
import { Entry } from "@/entities";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";
import { useContext } from "react";

interface Props {
  entry: Entry;
}

export function EntryPageEditHistory({ entry }: Props) {
  const { editHistory, setEditHistory } = useContext(EntryPageContext);

  return editHistory ? (
    <EditHistory entry={entry} onHide={() => setEditHistory(!editHistory)} />
  ) : (
    <></>
  );
}
