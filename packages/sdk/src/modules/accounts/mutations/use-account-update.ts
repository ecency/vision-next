import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
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

/**
 * React Query mutation hook for updating account profile metadata.
 *
 * This mutation broadcasts an account_update2 operation to update the user's
 * profile information (name, about, location, avatar, cover image, etc.).
 *
 * @param username - The username to update (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Profile Fields:**
 * - name: Display name
 * - about: Bio/description
 * - location: Location
 * - website: Website URL
 * - profile_image: Avatar URL
 * - cover_image: Cover/banner URL
 * - tokens: Social tokens (Twitter, Facebook, etc.)
 * - version: Profile metadata version (auto-set to 2)
 *
 * **Authentication:**
 * - Uses posting authority (account_update2 operation)
 * - Supports all auth methods via platform adapter
 *
 * **Post-Broadcast Actions:**
 * - Optimistically updates account cache with new profile data
 * - Invalidates account cache to refetch from blockchain
 *
 * @example
 * ```typescript
 * const updateProfile = useAccountUpdate(username, {
 *   adapter: myAdapter,
 * });
 *
 * // Update profile
 * updateProfile.mutate({
 *   profile: {
 *     name: "John Doe",
 *     about: "Hive enthusiast",
 *     profile_image: "https://...",
 *   }
 * });
 * ```
 */
export function useAccountUpdate(
  username: string | undefined,
  auth?: AuthContextV2
) {
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
    async (_data: unknown, variables: Partial<Payload>) => {
      // Optimistic cache update
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
      );

      // Invalidate cache to refetch from blockchain
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username)
        ]);
      }
    },
    auth
  );
}
