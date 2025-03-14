import { useState } from "react";
import { WaveEntry } from "@/entities";
import i18next from "i18next";
import { WavesListItem } from "@/app/waves/_components";
import { classNameObject } from "@ui/util";
import { WaveForm } from "@/features/waves";
import { useEntryDiscussionsList } from "@/features/entry-management";
import { UilCommentAdd } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { EcencyEntriesCacheManagement } from "@/core/caches";

interface Props {
  item: WaveEntry;
  i: number;
}

export function WaveViewDiscussionItem({ item, i }: Props) {
  const [expanded, setExpanded] = useState(false);

  const data = useEntryDiscussionsList(item);
  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(item).useClientQuery();

  return (
    <div
      className={classNameObject({
        "[&_.waves-list-item]:rounded-none first:rounded-t-2xl last:rounded-b-2xl border-[--border-color]":
          true,
        "border-b last:border-b-0": !expanded,
        "border-y-4 first:border-t-0 last:border-b-0": expanded
      })}
    >
      <WavesListItem
        key={entry!.post_id}
        item={entry as WaveEntry}
        i={i}
        commentSlot={expanded ? i18next.t("waves.hide-replies") : undefined}
        onExpandReplies={() => setExpanded(!expanded)}
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="relative bg-white dark:bg-dark-200 [&_.wave-form]:border-b [&_.wave-form]:border-[--border-color]"
          >
            <WaveForm entry={undefined} replySource={entry} />
            {data?.map((reply, j) => (
              <WaveViewDiscussionItem item={reply as WaveEntry} i={j} key={j} />
            ))}
            {data?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 p-4 md:py-6 lg:py-8 text-gray-400 dark:text-gray-600"
              >
                <UilCommentAdd />
                {i18next.t("waves.no-replies")}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
