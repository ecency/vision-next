"use client";

import { getWavesTrendingTagsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import i18next from "i18next";
import { Button } from "@ui/button";
import { Spinner } from "@ui/spinner";
import clsx from "clsx";
import { useWavesHost, useWavesTagFilter } from "@/app/waves/_context";

const TRENDING_TAGS_LIMIT = 12;
const TRENDING_TAGS_HOURS = 24;

export function WavesTrendingTagsCard() {
  const { host } = useWavesHost();
  const { selectedTag, setSelectedTag } = useWavesTagFilter();

  const { data, isLoading, isError } = useQuery(getWavesTrendingTagsQueryOptions(host, TRENDING_TAGS_HOURS));

  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);
  const tags = useMemo(() => data?.slice(0, TRENDING_TAGS_LIMIT) ?? [], [data]);

  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="font-semibold">{i18next.t("waves.whats-happening")}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {i18next.t("waves.whats-happening-subtitle", { hours: TRENDING_TAGS_HOURS })}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {i18next.t("waves.whats-happening-error")}
        </div>
      )}

      {!isLoading && !isError && tags.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {i18next.t("waves.whats-happening-empty")}
        </div>
      )}

      {!isLoading && !isError && tags.length > 0 && (
        <div className="flex flex-col gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTag === tag.tag;

            return (
              <Button
                key={tag.tag}
                full={true}
                appearance={isSelected ? "primary" : "gray"}
                className={clsx(
                  "flex items-center justify-between gap-3 text-sm font-semibold",
                  isSelected ? "bg-blue-dark-sky text-white" : "bg-transparent"
                )}
                onClick={() => setSelectedTag(isSelected ? null : tag.tag)}
              >
                <span className="flex-1 truncate text-left">#{tag.tag}</span>
                <span className="text-xs font-normal opacity-75 text-right whitespace-nowrap tabular-nums ml-4">
                  {numberFormatter.format(tag.posts)}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
