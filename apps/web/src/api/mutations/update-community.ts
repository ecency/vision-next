"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatError, updateCommunity } from "@/api/operations";
import { QueryIdentifiers } from "@/core/react-query";
import { error } from "@/features/shared";
import { getCommunityCache } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";

type UpdateCommunityPayload = NonNullable<Parameters<typeof updateCommunity>[2]>;

export function useUpdateCommunity(communityName: string) {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  // we don't need `community` here anymore
  useQuery(getCommunityCache(communityName));

  return useMutation({
    mutationKey: ["updateCommunity"],
    mutationFn: async ({
                         payload,
                         username
                       }: {
      payload: UpdateCommunityPayload;
      username?: string;
    }) => {
      await updateCommunity(username ?? activeUser!.username, communityName, payload);
      return payload;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(
          [QueryIdentifiers.COMMUNITY, communityName],
          (prev) => {
            // ensure we're only spreading objects
            const base =
                prev && typeof prev === "object" ? (prev as Record<string, unknown>) : {};
            return {
              ...base,
              ...(payload as Record<string, unknown>)
            };
          }
      );
    },
    onError: (err) => error(...formatError(err))
  });
}
