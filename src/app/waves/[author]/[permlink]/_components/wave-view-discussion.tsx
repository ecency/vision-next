"use client";

import { WaveEntry } from "@/entities";
import { WavesListItem } from "@/app/waves/_components";
import { useWaveDiscussionsList } from "@/features/waves";

interface Props {
  entry: WaveEntry;
}

export function WaveViewDiscussion({ entry }: Props) {
  const data = useWaveDiscussionsList(entry);

  return (
    <div>
      <div className="p-4 text-sm font-semibold opacity-50">Replies</div>
      <div>
        {data?.map((item, i) => (
          <WavesListItem key={item.post_id} item={item as WaveEntry} i={i} />
        ))}
      </div>
    </div>
  );
}
