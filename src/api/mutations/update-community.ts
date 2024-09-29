import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError, updateCommunity } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { QueryIdentifiers } from "@/core/react-query";
import { clone } from "remeda";
import { error } from "@/features/shared";
import { getCommunityCache } from "@/core/caches";

export function useUpdateCommunity(communityName: string) {
  const queryClient = useQueryClient();

  const activeUser = useGlobalStore((state) => state.activeUser);
  const { data: community } = getCommunityCache(communityName).useClientQuery();

  return useMutation({
    mutationKey: ["updateCommunity"],
    mutationFn: async ({
      payload,
      username
    }: {
      payload: Parameters<typeof updateCommunity>[2];
      username?: string;
    }) => {
      await updateCommunity(username ?? activeUser!.username, communityName, payload);
      return payload;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData([QueryIdentifiers.COMMUNITY, communityName], {
        ...clone(community),
        ...payload
      });
    },
    onError: (err) => error(...formatError(err))
  });
}
