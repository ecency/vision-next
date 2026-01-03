import { useBroadcastMutation } from "@/modules/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as R from "remeda";
import { getAccountFullQueryOptions } from "../queries";
import { AccountProfile, FullAccount } from "../types";
import {
  buildProfileMetadata,
  extractAccountProfile,
} from "../utils/profile-metadata";

interface Payload {
  profile: Partial<AccountProfile>;
  tokens: AccountProfile["tokens"];
}

export function useAccountUpdate(username: string) {
  const queryClient = useQueryClient();

  const { data } = useQuery(getAccountFullQueryOptions(username));

  return useBroadcastMutation(
    ["accounts", "update"],
    username,
    (payload: Partial<Payload>) => {
      if (!data) {
        throw new Error("[SDK][Accounts] – cannot update not existing account");
      }

      const profile = buildProfileMetadata({
        existingProfile: extractAccountProfile(data),
        profile: payload.profile,
        tokens: payload.tokens,
      });

      return [
        [
          "account_update2",
          {
            account: username,
            json_metadata: "",
            extensions: [],
            posting_json_metadata: JSON.stringify({
              profile,
            }),
          },
        ],
      ];
    },
    (_, variables) =>
      queryClient.setQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }

          const obj = R.clone(data);
          obj.profile = buildProfileMetadata({
            existingProfile: extractAccountProfile(data),
            profile: variables.profile,
            tokens: variables.tokens,
          });

          return obj;
        }
      )
  );
}
