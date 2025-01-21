import { WaveForm } from "@/features/waves";

export function WavesCreateCard() {
  return (
    <div id="wave-form" className="rounded-2xl bg-white dark:bg-dark-200 mb-4 lg:mb-6 xl:mb-8">
      <WaveForm entry={undefined} />
    </div>
  );
}
