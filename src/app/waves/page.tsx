"use client";

import { WavesCreateCard, WavesList } from "@/app/waves/_components";
import { WavesHostSelection } from "@/app/waves/_components/waves-host-selection";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";

export default function WavesPage() {
  const [host, setHost] = useLocalStorage(PREFIX + "_wh", "ecency.waves");

  return (
    <>
      <WavesHostSelection host={host!} setHost={setHost} />
      <WavesCreateCard />
      <WavesList host={host!} />
    </>
  );
}
