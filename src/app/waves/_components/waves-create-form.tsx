import { WaveForm } from "@/features/waves";

export function WavesCreateForm() {
  return (
    <div className="rounded-2xl bg-white dark:bg-dark-200 mb-4 lg:mb-6 xl:mb-8">
      <WaveForm entry={undefined} />
    </div>
  );
}
