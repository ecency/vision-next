import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { useInfiniteDataFlow } from "@/utils";

export function WavesList() {
  const { data } = getWavesByHostQuery("ecency.waves").useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <div className="max-w-[400px]">
      {dataFlow.map((item) => (
        <WavesListItem key={item.id} item={item} />
      ))}
    </div>
  );
}
