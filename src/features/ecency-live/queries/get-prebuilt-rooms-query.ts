import { useEcencyLive } from "@/features/ecency-live";
import { useQuery } from "@tanstack/react-query";
import { EcencyLiveQueryIdentifiers } from "@/features/ecency-live/enums";
import { PREBUILT_LIVE_CHANNELS } from "@/features/ecency-live/consts";

export function useGetPrebuiltRoomsQuery() {
  const live = useEcencyLive();

  return useQuery({
    queryKey: [EcencyLiveQueryIdentifiers.PrebuiltRooms],
    enabled: !!live?.[1],
    queryFn: async () =>
      (
        await Promise.all(
          PREBUILT_LIVE_CHANNELS.map(
            async (roomId) => [roomId, await live?.[1].getRoom(roomId)] as const
          )
        )
      ).filter(([_, room]) => !!room)
  });
}
