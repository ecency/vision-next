import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Community, CommunityTeam } from "@/entities";
import { formatError, setUserRole } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { clone } from "remeda";
import { QueryIdentifiers } from "@/core/react-query";
import { error } from "@/features/shared";
import { getCommunityCache } from "@/core/caches";

export function useCommunitySetUserRole(communityName: string, onSuccess?: () => void) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const queryClient = useQueryClient();

  const { data: community } = getCommunityCache(communityName).useClientQuery();

  return useMutation({
    mutationKey: ["community-set-user-role", communityName],
    mutationFn: async ({ user, role }: { user: string; role: string }) => {
      await setUserRole(activeUser!.username, communityName, user, role);
      return { user, role };
    },
    onSuccess: ({ user, role }) => {
      onSuccess?.();
      const team = clone(community?.team ?? []);
      const nTeam =
        team.find((x) => x[0] === user) === undefined
          ? [...team, [user, role, ""]]
          : team.map((x) => (x[0] === user ? [x[0], role, x[2]] : x));
      queryClient.setQueryData([QueryIdentifiers.COMMUNITY, communityName], {
        ...clone(community),
        ...{ ...clone(community), team: nTeam }
      });
    },
    onError: (err) => error(...formatError(err))
  });
}
