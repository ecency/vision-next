"use client";

import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { Fragment, useState } from "react";
import { useInfiniteDataFlow } from "@/utils";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { WaveEntry } from "@/entities";

interface Props {
  host: string;
}

export function WavesListView({ host }: Props) {
  const { data, fetchNextPage, isError, hasNextPage } = getWavesByHostQuery(host).useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  const [replyingEntry, setReplyingEntry] = useState<WaveEntry>();

  return (
    <div className="flex flex-col pb-8">
        {data?.pages?.flatMap((page) =>
            page.map((item, j) => (
                <WavesListItem
                    key={`${item.author}/${item.permlink}`}
                    i={j}
                    item={item}
                    onExpandReplies={() => setReplyingEntry(item)}
                />
            ))
        )}

      <WavesListLoader data={dataFlow} failed={isError} isEndReached={!hasNextPage} />
      <DetectBottom onBottom={() => fetchNextPage()} />

      <WavesFastReplyDialog
        show={!!replyingEntry}
        onHide={() => setReplyingEntry(undefined)}
        entry={replyingEntry}
      />
    </div>
  );
}
