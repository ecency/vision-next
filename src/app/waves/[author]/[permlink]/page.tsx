"use client";

import { WavesListItem } from "@/app/waves/_components";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { WaveEntry } from "@/entities";

interface Props {
  params: {
    author: string;
    permlink: string;
  };
}

export default function WaveViewPage({ params: { author, permlink } }: Props) {
  const { data } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    author,
    permlink
  ).useClientQuery();

  return <div>{data && <WavesListItem item={data as WaveEntry} i={0} />}</div>;
}
