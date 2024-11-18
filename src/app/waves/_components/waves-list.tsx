import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { Fragment } from "react";
import { useInfiniteDataFlow } from "@/utils";

interface Props {
  host: string;
}

export function WavesList({ host }: Props) {
  const { data, fetchNextPage, isError, hasNextPage } = getWavesByHostQuery(host).useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8 pb-8">
      {data?.pages?.map((page, i) => (
        <Fragment key={i}>
          {page.map((item, j) => (
            <WavesListItem i={j} key={item.id} item={item} />
          ))}
        </Fragment>
      ))}

      <WavesListLoader data={dataFlow} failed={isError} isEndReached={!hasNextPage} />
      <DetectBottom onBottom={() => fetchNextPage()} />
    </div>
  );
}
