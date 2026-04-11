import { WaveForm } from "@/features/waves";

export function WavesCreateCard() {
  return (
    <div id="wave-form" className="bg-white dark:bg-dark-200 border-b border-[--border-color]">
      <WaveForm entry={undefined} />
    </div>
  );
}
