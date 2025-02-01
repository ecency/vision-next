import { useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastPostingJSON, formatError } from "@/api/operations";
import { error, success } from "@/features/shared";
import { AccountRelationship } from "@/api/bridge";
import { QueryIdentifiers } from "@/core/react-query";
import i18next from "i18next";
import { useGetRelationshipBtwAccounts } from "../queries";

export function useFollow(follower: string, following: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["follow-account", follower, following],
    mutationFn: async ({ isFollow }: { isFollow: boolean }) =>
      [
        await broadcastPostingJSON(follower, "follow", [
          "follow",
          {
            follower,
            following,
            what: [...(isFollow ? ["blog"] : [""])]
          }
        ]),
        isFollow
      ] as const,
    onError: (err: Error) => {
      error(...formatError(err));
    },
    onSuccess: ([_, isFollow]) => {
      queryClient.setQueryData<AccountRelationship | null>(
        [QueryIdentifiers.GET_RELATIONSHIP_BETWEEN_ACCOUNTS, follower, following],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            follows: isFollow,
            ignores: false,
            is_blacklisted: data.is_blacklisted,
            follows_blacklists: data.follows_blacklists
          };
        }
      );
    }
  });
}

export function useIgnore(follower?: string, following?: string) {
  const queryClient = useQueryClient();

  const { data } = useGetRelationshipBtwAccounts(follower, following);

  return useMutation({
    mutationKey: ["follow-account", "ignore", follower, following],
    mutationFn: () => {
      if (!following || !follower) {
        throw new Error("Follower or following missed");
      }
      return broadcastPostingJSON(follower, "follow", [
        "follow",
        {
          follower,
          following,
          what: ["ignore"]
        }
      ]);
    },
    onError: (err: Error) => {
      error(...formatError(err));
    },
    onSuccess: () => {
      if (data?.ignores === true) {
        success(i18next.t("events.unmuted"));
      } else {
        success(i18next.t("events.muted"));
      }

      queryClient.setQueryData<AccountRelationship | null>(
        [QueryIdentifiers.GET_RELATIONSHIP_BETWEEN_ACCOUNTS, follower, following],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            follows: data.follows,
            ignores: !data?.ignores,
            is_blacklisted: data.is_blacklisted,
            follows_blacklists: data.follows_blacklists
          };
        }
      );
    }
  });
}
