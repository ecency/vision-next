import { WavesCreateForm, WavesInfiniteList, WavesList } from "@/app/waves/_components";

export default function WavesPage() {
  return (
    <div>
      <WavesCreateForm />
      <WavesList />
      <WavesInfiniteList />
    </div>
  );
}
