import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { useInfiniteDataFlow } from "@/utils";

export function WavesList() {
  const { data } = getWavesByHostQuery("ecency.waves").useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
      {dataFlow.map((item, i) => (
        <WavesListItem i={i} key={item.id} item={item} />
      ))}
    </div>
  );
}
