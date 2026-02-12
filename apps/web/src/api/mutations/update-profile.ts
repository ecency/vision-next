"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountProfile, FullAccount } from "@/entities";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { QueryIdentifiers } from "@/core/react-query";
import { useUpdateProfileMutation } from "@/api/sdk-mutations";

/**
 * Web app-specific profile update mutation hook that wraps SDK mutation with app cache management.
 *
 * This hook provides:
 * - SDK-based profile update mutation (authentication, broadcasting)
 * - Web app-specific user feedback (success/error messages)
 * - Legacy API compatibility (wraps account parameter for backward compatibility)
 *
 * @param account - Full account data
 * @returns Mutation result with updateProfile function
 *
 * @example
 * ```typescript
 * const { mutateAsync: updateProfile, isPending } = useUpdateProfile(account);
 * await updateProfile({
 *   nextProfile: {
 *     name: "John Doe",
 *     about: "Hive enthusiast",
 *     profile_image: "https://...",
 *   }
 * });
 * ```
 *
 * @remarks
 * This is a compatibility wrapper that maintains the old API while using SDK underneath.
 * For new code, consider using `useUpdateProfileMutation` directly from SDK mutations.
 */
export function useUpdateProfile(account: FullAccount) {
  const { mutateAsync: sdkUpdateProfile } = useUpdateProfileMutation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["update-profile", account.name],
    mutationFn: async ({ nextProfile }: { nextProfile: AccountProfile }) => {
      // Use SDK mutation
      await sdkUpdateProfile({
        profile: nextProfile,
      });

      return nextProfile;
    },
    onSuccess: (profile) => {
      success(i18next.t("g.success"));

      // SDK already updates the cache, but we also manually update here
      // for immediate UI feedback (optimistic update)
      queryClient.setQueryData<FullAccount>(
        [QueryIdentifiers.GET_ACCOUNT_FULL, account.name],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            ...data,
            profile: {
              ...data.profile,
              ...profile,
            },
          };
        }
      );
    },
    onError: () => {
      error(i18next.t("g.server-error"));
    },
  });
}
