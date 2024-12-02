"use client";

import { WaveEntry } from "@/entities";
import { WaveViewDiscussionItem } from "@/app/waves/[author]/[permlink]/_components/wave-view-discussion-item";
import { useEntryDiscussionsList } from "@/features/entry-management";
import { UilCommentAdd } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { AnimatePresence, motion } from "framer-motion";

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
        <AnimatePresence>
          {data?.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-4 p-4 md:py-6 lg:py-8 text-gray-400 dark:text-gray-600"
            >
              <UilCommentAdd />
              {i18next.t("waves.no-replies")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
