import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";

export async function WavesList() {
  const data = await getWavesByHostQuery("ecency.waves").prefetch();
  return (
    <div className="max-w-[400px]">
      {data?.pages[0].map((item) => <WavesListItem key={item.id} item={item} />)}
    </div>
  );
}
