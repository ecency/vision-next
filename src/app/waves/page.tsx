"use client";

import { WavesCreateCard, WavesList } from "@/app/waves/_components";
import { WavesHostSelection } from "@/app/waves/_components/waves-host-selection";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { EcencyConfigManager } from "@/config";
import { notFound } from "next/navigation";

export default function WavesPage() {
  const [host, setHost] = useLocalStorage(PREFIX + "_wh", "ecency.waves");
  const isWavesEnabled = EcencyConfigManager.useConfig(
    ({ visionFeatures }) => visionFeatures.waves.enabled
  );

  if (!isWavesEnabled) {
    return notFound();
  }

  return (
    <>
      <WavesHostSelection host={host!} setHost={setHost} />
      <WavesCreateCard />
      <WavesList host={host!} />
    </>
  );
}
