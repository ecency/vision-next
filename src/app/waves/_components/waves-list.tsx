import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { useInfiniteDataFlow } from "@/utils";
import { DetectBottom } from "@/features/shared";

interface Props {
  host: string;
}

export function WavesList({ host }: Props) {
  const { data, fetchNextPage } = getWavesByHostQuery(host).useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
      {dataFlow.map((item, i) => (
        <WavesListItem i={i} key={item.id} item={item} />
      ))}
      <DetectBottom onBottom={() => fetchNextPage()} />
    </div>
  );
}
