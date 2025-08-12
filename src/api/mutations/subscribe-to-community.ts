import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Community, Subscription } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { broadcastPostingJSON, formatError } from "@/api/operations";
import { error } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";

export function useSubscribeToCommunity(community: Community) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["subscribeToCommunity", activeUser?.username, community?.name],
    mutationFn: async ({ isSubscribe }: { isSubscribe: boolean }) => {
      if (!activeUser) {
        throw new Error("Can`t subscribe w/o active user");
      }

      if (isSubscribe) {
        return [
          isSubscribe,
          await broadcastPostingJSON(activeUser?.username, "community", [
            "subscribe",
            { community: community.name }
          ])
        ] as const;
      } else {
        return [
          isSubscribe,
          await broadcastPostingJSON(activeUser?.username, "community", [
            "unsubscribe",
            { community: community.name }
          ])
        ] as const;
      }
    },
    onSuccess: ([isSubscribe]) => {
      queryClient.setQueryData<Subscription[] | undefined>(
        ["accounts", "subscriptions", activeUser?.username],
        (data) => {
          if (!data) {
            return isSubscribe
              ? [[community.name, community.title, "guest", ""]]
              : data;
          }

          return isSubscribe
            ? [...data, [community.name, community.title, "guest", ""]]
            : data.filter(([u]) => u !== community.name);
        }
      );
      queryClient.invalidateQueries({
        queryKey: [QueryIdentifiers.COMMUNITY, community.name]
      });
    },
    onError: (err) => error(...formatError(err))
  });
}
