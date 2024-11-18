"use client";

import { WavesCreateCard, WavesList } from "@/app/waves/_components";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";

export default function WavesPage() {
  const [host, setHost] = useLocalStorage(PREFIX + "_wh", "ecency.waves");

  return (
    <>
      <WavesCreateCard />
      <WavesList />
    </>
  );
}
