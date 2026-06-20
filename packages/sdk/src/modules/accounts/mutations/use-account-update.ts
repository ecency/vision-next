import { useBroadcastMutation, invalidateAfterBroadcast, QueryKeys } from "@/modules/core";
import type { BroadcastMode } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import { AccountProfile, FullAccount } from "../types";
import {
  buildPostingJsonMetadata,
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
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  const queryClient = useQueryClient();

  const { data } = useQuery(getAccountFullQueryOptions(username));

  return useBroadcastMutation(
    ["accounts", "update"],
    username,
    (payload: Partial<Payload>) => {
      // Prefer the freshest cached snapshot. onMutate has just refetched the
      // account from chain, so this reflects the current on-chain profile
      // rather than a possibly stale/unloaded render-time value.
      const account =
        queryClient.getQueryData<FullAccount>(
          getAccountFullQueryOptions(username).queryKey
        ) ?? data;

      if (!account) {
        throw new Error("[SDK][Accounts] – cannot update not existing account");
      }

      return [
        [
          "account_update2",
          {
            account: username!,
            json_metadata: "",
            extensions: [] as [],
            // Read-modify-write the FULL on-chain metadata: deep-merge the
            // profile and preserve any non-`profile` top-level keys, so a
            // partial update never wipes unrelated fields.
            posting_json_metadata: buildPostingJsonMetadata({
              existingPostingJsonMetadata: account.posting_json_metadata,
              profile: payload.profile,
              tokens: payload.tokens,
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

          const obj = JSON.parse(JSON.stringify(data)) as FullAccount;
          obj.profile = buildProfileMetadata({
            existingProfile: extractAccountProfile(data),
            profile: variables.profile,
            tokens: variables.tokens,
          });

          return obj;
        }
      );

      // Invalidate cache to refetch from blockchain
      await invalidateAfterBroadcast(auth?.adapter, broadcastMode, [
        QueryKeys.accounts.full(username)
      ]);
    },
    auth,
    undefined,
    {
      broadcastMode,
      // Before merging, force a fresh on-chain read so a stale or unloaded
      // cached snapshot cannot cause a partial update (e.g. pinning a post,
      // which sets only `pinned`) to overwrite the existing profile with a
      // near-empty object. Best-effort: if the refetch fails, the op builder
      // falls back to the cached snapshot.
      onMutate: async () => {
        if (!username) {
          return;
        }
        try {
          await queryClient.fetchQuery({
            ...getAccountFullQueryOptions(username),
            staleTime: 0,
          });
        } catch {
          // Ignore – fall back to whatever is already cached.
        }
      },
    }
  );
}
