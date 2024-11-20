"use client";

import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { renderPostBody } from "@ecency/render-helper";
import { useRenderWaveBody, WaveActions, WaveForm } from "@/features/waves";
import { motion } from "framer-motion";
import { WaveEntry } from "@/entities";
import React, { useRef } from "react";
import useMount from "react-use/lib/useMount";

interface Props {
  entry: WaveEntry;
}

export function WaveViewDetails({ entry }: Props) {
  const renderAreaRef = useRef<HTMLDivElement>(null);
  const renderBody = useRenderWaveBody(renderAreaRef, entry, {});

  useMount(() => renderBody());
  const status = "default";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl bg-white dark:bg-dark-200 cursor-pointer"
    >
      <WavesListItemHeader entry={entry} hasParent={false} pure={false} status={status} />
      <div
        className="p-4 thread-render"
        ref={renderAreaRef}
        dangerouslySetInnerHTML={{ __html: renderPostBody(entry!) }}
      />
      <WaveActions
        status={status}
        entry={entry}
        onEntryView={() => {}}
        hasParent={false}
        pure={false}
        onEdit={() => {}}
      />
      <div className="border-t border-[--border-color]"></div>
      <WaveForm entry={undefined} replySource={entry} />
    </motion.div>
  );
}
