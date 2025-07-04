"use client";

import { getPromotedEntriesQuery, getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { Fragment, useMemo, useState } from "react";
import { useInfiniteDataFlow } from "@/utils";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { WaveEntry } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getPromotedPostsQuery } from "@ecency/sdk";

interface Props {
  host: string;
}

export function WavesListView({ host }: Props) {
  const { data, fetchNextPage, isError, hasNextPage } = getWavesByHostQuery(host).useClientQuery();
  const { data: promoted } = useQuery(getPromotedPostsQuery<WaveEntry>("waves"));
  const dataFlow = useInfiniteDataFlow(data);
  const combinedDataFlow = useMemo(() => {
    if (!promoted) {
      return dataFlow;
    }

    const tempPromoted = [...promoted];
    return dataFlow
      .filter(({ author, permlink }) =>
        promoted.every(
          ({ author: promotedAuthor, permlink: promotedPermlink }) =>
            promotedAuthor !== author || promotedPermlink !== permlink
        )
      )
      .reduce(
        (acc, item, index) => [
          ...acc,
          item,
          ...(index % 4 === 0 && tempPromoted.length > 0 ? [tempPromoted.shift()!] : [])
        ],
        [] as WaveEntry[]
      );
  }, [dataFlow, promoted]);

  const [replyingEntry, setReplyingEntry] = useState<WaveEntry>();

  return (
    <div className="flex flex-col pb-8">
      {combinedDataFlow.map((item, i) => (
        <WavesListItem
          key={`${item.author}/${item.permlink}`}
          i={i}
          item={item}
          onExpandReplies={() => setReplyingEntry(item)}
        />
      ))}

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
