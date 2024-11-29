"use client";

import { WaveEntry } from "@/entities";
import { WaveViewDiscussionItem } from "@/app/waves/[author]/[permlink]/_components/wave-view-discussion-item";
import { useEntryDiscussionsList } from "@/features/entry-management";

interface Props {
  entry: WaveEntry;
}

export function WaveViewDiscussion({ entry }: Props) {
  const data = useEntryDiscussionsList(entry);

  return (
    <div className="mb-4">
      <div className="p-4 text-sm font-semibold opacity-50">Replies</div>
      <div>
        {data.map((item, i) => (
          <WaveViewDiscussionItem
            key={item.author + item.permlink}
            item={item as WaveEntry}
            i={i}
          />
        ))}
      </div>
    </div>
  );
}
