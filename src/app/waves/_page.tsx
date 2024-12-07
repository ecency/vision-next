"use client";

import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { WavesHostSelection } from "@/app/waves/_components/waves-host-selection";
import { WavesCreateCard, WavesList } from "@/app/waves/_components";

export function WavesPage() {
  const [host, setHost] = useLocalStorage(PREFIX + "_wh", "ecency.waves");

  return (
    <>
      <WavesHostSelection host={host!} setHost={setHost} />
      <WavesCreateCard />
      <WavesList host={host!} />
    </>
  );
}
