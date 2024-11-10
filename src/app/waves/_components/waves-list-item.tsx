import { WaveEntry } from "@/entities";
import { renderPostBody } from "@ecency/render-helper";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";

interface Props {
  item: WaveEntry;
}

export function WavesListItem({ item }: Props) {
  return (
    <div>
      <WavesListItemHeader entry={item} hasParent={false} pure={false} status="" />
      <div dangerouslySetInnerHTML={{ __html: renderPostBody(item) }} />
    </div>
  );
}
