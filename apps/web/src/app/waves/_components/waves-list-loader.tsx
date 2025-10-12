import i18next from "i18next";
import React from "react";
import { WaveEntry } from "@/entities";

interface Props {
  data: WaveEntry[];
  failed: boolean;
  isEndReached: boolean;
  endReachedLabel?: string;
}

export function WavesListLoader({ data, isEndReached, endReachedLabel, failed }: Props) {
  if (data.length === 0) {
    return <></>;
  }

  const label = failed
    ? i18next.t("decks.columns.infinite-failed")
    : isEndReached
      ? endReachedLabel ?? ""
      : i18next.t("decks.columns.infinite-loading");

  if (!label) {
    return <></>;
  }

  return (
    <div className="p-4 text-center text-gray-600 dark:text-gray-400">
      {label}
    </div>
  );
}
