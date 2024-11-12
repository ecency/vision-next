import { WaveEntry } from "@/entities";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { useRef } from "react";
import { useRenderWaveBody } from "@/features/waves";
import useMount from "react-use/lib/useMount";
import { renderPostBody } from "@ecency/render-helper";

interface Props {
  item: WaveEntry;
}

export function WavesListItem({ item }: Props) {
  const renderAreaRef = useRef<HTMLDivElement>(null);

  const renderBody = useRenderWaveBody(renderAreaRef, item, {});

  useMount(() => renderBody());

  return (
    <div>
      <WavesListItemHeader entry={item} hasParent={false} pure={false} status="" />
      <div ref={renderAreaRef} dangerouslySetInnerHTML={{ __html: renderPostBody(item) }} />
    </div>
  );
}
