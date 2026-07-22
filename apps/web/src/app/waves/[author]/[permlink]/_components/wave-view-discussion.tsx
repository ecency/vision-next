"use client";

import { WaveEntry } from "@/entities";
import { WaveViewDiscussionItem } from "@/app/waves/[author]/[permlink]/_components/wave-view-discussion-item";
import { useEntryDiscussionsList } from "@/features/entry-management";
import { UilCommentAdd } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

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
        {data?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 p-4 md:py-6 lg:py-8 text-gray-400 dark:text-gray-600">
            <UilCommentAdd className="size-6" />
            {i18next.t("waves.no-replies")}
          </div>
        )}
      </div>
    </div>
  );
}
