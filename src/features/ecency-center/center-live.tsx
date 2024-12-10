"use client";

import { useGetPrebuiltRoomsQuery } from "@/features/ecency-live/queries";
import { EcencyLiveItem } from "@/features/ecency-live/ecency-live-item";

export function CenterLive() {
  const { data: prebuiltRooms } = useGetPrebuiltRoomsQuery();

  return (
    <div className="flex flex-col">
      {prebuiltRooms?.map(([id, room]) => <EcencyLiveItem key={id} room={room!} />)}
    </div>
  );
}
