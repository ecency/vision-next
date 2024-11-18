"use client";

import { WaveEntry } from "@/entities";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { useRef } from "react";
import { useRenderWaveBody, WaveActions } from "@/features/waves";
import useMount from "react-use/lib/useMount";
import { renderPostBody } from "@ecency/render-helper";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { motion } from "framer-motion";
import "./waves-list-item.scss";

interface Props {
  item: WaveEntry;
  i: number;
}

export function WavesListItem({ item, i }: Props) {
  const renderAreaRef = useRef<HTMLDivElement>(null);
  const { data: entry } =
    EcencyEntriesCacheManagement.getEntryQuery<WaveEntry>(item).useClientQuery();

  const renderBody = useRenderWaveBody(renderAreaRef, item, {});

  useMount(() => renderBody());
  const status = "default";

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      className="rounded-2xl bg-white dark:bg-dark-200"
    >
      <WavesListItemHeader entry={entry!} hasParent={false} pure={false} status={status} />
      <div
        className="p-4 thread-render"
        ref={renderAreaRef}
        dangerouslySetInnerHTML={{ __html: renderPostBody(entry!) }}
      />
      <WaveActions
        status={status}
        entry={item}
        onEntryView={() => {}}
        commentsSlot={<></>}
        hasParent={false}
        pure={false}
        onEdit={() => {}}
      />
    </motion.div>
  );
}
