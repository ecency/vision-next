"use client";

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

export function WavesPage() {
  const [host, setHost] = useLocalStorage(PREFIX + "_wh", "ecency.waves");
  const [grid] = useWavesGrid();

  return (
    <>
      <WavesNavigationLayout>
        <div />
        <div className="flex items-center gap-2">
          <WavesHostSelection host={host!} setHost={setHost} />
          <span className="hidden lg:block w-[1px] bg-[--border-color] h-6" />
          <WavesGridSelection />
        </div>
      </WavesNavigationLayout>
      <WavesCreateCard />
      {grid === "feed" && <WavesListView host={host!} />}
      {grid === "masonry" && <WavesMasonryView host={host!} />}
    </>
  );
}
