import { useEcencyLive } from "@/features/ecency-live";
import { useQuery } from "@tanstack/react-query";
import { EcencyLiveQueryIdentifiers } from "@/features/ecency-live/enums";
import { PREBUILT_LIVE_CHANNELS } from "@/features/ecency-live/consts";

export function useGetPrebuiltRoomsQuery() {
  const [state, api] = useEcencyLive();

  return useQuery({
    queryKey: [EcencyLiveQueryIdentifiers.PrebuiltRooms],
    queryFn: async () =>
      (
        await Promise.all(
          PREBUILT_LIVE_CHANNELS.map(async (roomId) => [roomId, await api.getRoom(roomId)] as const)
        )
      ).filter(([_, room]) => !!room)
  });
}
