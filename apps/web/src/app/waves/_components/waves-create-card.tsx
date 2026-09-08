import { WaveForm } from "@/features/waves";

export function WavesCreateCard() {
  return (
    <div id="wave-form" className="reading-surface border-b border-[--border-color]">
      <WaveForm entry={undefined} />
    </div>
  );
}
