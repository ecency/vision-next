"use client";

import { getWavesByHostQuery } from "@/api/queries";
import { useInfiniteDataFlow } from "@/utils";
import { useMemo, useState } from "react";
import { WaveEntry } from "@/entities";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { DetectBottom } from "@/features/shared";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { useWavesAutoRefresh } from "@/app/waves/_hooks";
import { WavesRefreshPopup } from "@/app/waves/_components";

interface Props {
  host: string;
}

export function WavesMasonryView({ host }: Props) {
  const { data, fetchNextPage, isError, hasNextPage, refetch } = getWavesByHostQuery(host).useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);
  const { newWaves, clear, now } = useWavesAutoRefresh(dataFlow[0]);

  const [replyingEntry, setReplyingEntry] = useState<WaveEntry>();

  // Transforming the pages to next format N columns
  const masonryDataFlow = useMemo(
    () =>
      data?.pages?.reduce<WaveEntry[][][]>(
        (acc, page, pageIndex) => {
          page.map((item, itemIndex) => {
            const column = itemIndex % 2;

            if (acc[column] && acc[column][pageIndex]) {
              acc[column][pageIndex].push(item);
            } else if (acc[column] && !acc[column][pageIndex]) {
              acc[column][pageIndex] = [item];
            }
          });

          return acc;
        },
        [[], []]
      ),
    [data]
  );

  return (
    <div>
      {newWaves.length > 0 && (
        <WavesRefreshPopup
          entries={newWaves}
          onClick={async () => {
            await refetch();
            clear();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
      <div className="grid grid-cols-2 items-start gap-4 pb-8">
          {masonryDataFlow?.map((column, colIndex) => (
              <div className="flex flex-col gap-4" key={colIndex}>
                  {column.flat().map((item, index) => (
                      <WavesListItem
                          key={`${item.author}/${item.permlink}`}
                          i={index}
                          item={item}
                          onExpandReplies={() => setReplyingEntry(item)}
                          now={now}
                      />
                  ))}
              </div>
          ))}
      </div>

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
