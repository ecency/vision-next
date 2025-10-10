"use client";

import { useEffect } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { WavesHostSelection } from "@/app/waves/_components/waves-host-selection";
import {
  WavesCreateCard,
  WavesListView,
  WavesMasonryView,
  WavesNavigationLayout
} from "@/app/waves/_components";
import { WavesGridSelection } from "@/app/waves/_components/waves-grid-selection";
import { useWavesGrid } from "@/app/waves/_hooks";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useWavesHost, useWavesTagFilter } from "@/app/waves/_context";

export function WavesPage() {
  const { host, setHost } = useWavesHost();
  const [, setWaveFormHost] = useLocalStorage<string>(PREFIX + "_wf_th", "ecency.waves");
  const [grid, setGrid] = useWavesGrid();
  const { selectedTag, setSelectedTag } = useWavesTagFilter();

  useEffect(() => {
    if (selectedTag && grid !== "feed") {
      setGrid("feed");
    }
  }, [grid, selectedTag, setGrid]);

  const handleHostChange = (nextHost: string) => {
    setHost(nextHost);
    setWaveFormHost(nextHost);
    if (selectedTag) {
      setSelectedTag(null);
    }
  };

  useEffect(() => {
    if (host) {
      setWaveFormHost(host);
    }
  }, [host, setWaveFormHost]);

  return (
    <>
      <WavesNavigationLayout>
        <div />
        <div className="flex items-center gap-2">
          <WavesHostSelection host={host} setHost={handleHostChange} />
          {!selectedTag && (
            <>
              <span className="hidden lg:block w-[1px] bg-[--border-color] h-6" />
              <WavesGridSelection />
            </>
          )}
        </div>
      </WavesNavigationLayout>
      <WavesCreateCard />
      {selectedTag && (
        <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">
            {i18next.t("waves.tag-feed-indicator", { tag: selectedTag })}
          </span>
          <Button appearance="gray-link" size="xs" onClick={() => setSelectedTag(null)}>
            {i18next.t("waves.tag-feed-clear")}
          </Button>
        </div>
      )}
      {grid === "feed" && <WavesListView host={host} />}
      {grid === "masonry" && !selectedTag && <WavesMasonryView host={host} />}
    </>
  );
}
