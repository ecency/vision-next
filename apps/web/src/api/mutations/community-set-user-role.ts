"use client";

import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { Community, CommunityTeam } from "@/entities";
import { formatError } from "@/api/format-error";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { clone } from "remeda";
import { error } from "@/features/shared";
import { QueryKeys } from "@ecency/sdk";
import { getCommunityCache } from "@/core/caches";
import { useSetCommunityRoleMutation } from "@/api/sdk-mutations";

type TeamRow = [string, string, string]; // one member entry

export function useCommunitySetUserRole(communityName: string, onSuccess?: () => void) {
    const { activeUser } = useActiveAccount();
    const queryClient = useQueryClient();

    // Tell TS that this query returns a Community
    const { data: community } =
        (useQuery(getCommunityCache(communityName)) as UseQueryResult<Community, Error>);

    // Use SDK mutation for broadcasting
    const { mutateAsync: setRoleSdk } = useSetCommunityRoleMutation(communityName);

    return useMutation({
        mutationKey: ["community-set-user-role", communityName],
        mutationFn: async ({ user, role }: { user: string; role: string }) => {
            await setRoleSdk({ account: user, role });
            return { user, role };
        },
        onSuccess: ({ user, role }) => {
            onSuccess?.();

            queryClient.setQueryData<Community | undefined>(
                QueryKeys.communities.single(communityName, ""),
                (prev) => {
                    const base = (prev ?? community);
                    if (!base) return prev; // nothing cached yet

                    // Pin the array types so TS doesn't widen them
                    const team: CommunityTeam = clone((base.team ?? []) as CommunityTeam);
                    const exists = team.some(([name]) => name === user);

                    const nextTeam: CommunityTeam = exists
                        ? (team.map((row): TeamRow =>
                            row[0] === user ? [row[0], role, row[2]] : [row[0], row[1], row[2]]
                        ) as CommunityTeam)
                        : ([...team, [user, role, ""]] as CommunityTeam);

                    return {
                        ...base,
                        team: nextTeam,
                    };
                }
            );
        },
        onError: (err) => error(...formatError(err)),
    });
}
