"use client";

import { useMutation } from "@tanstack/react-query";
import { AccountProfile, FullAccount } from "@/entities";
import { error, success } from "@/features/shared";
import i18next from "i18next";
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
export function useUpdateProfile(account: FullAccount | null) {
  const { mutateAsync: sdkUpdateProfile } = useUpdateProfileMutation();

  return useMutation({
    mutationKey: ["update-profile", account?.name],
    mutationFn: async ({ nextProfile }: { nextProfile: AccountProfile }) => {
      if (!account) {
        throw new Error("Account is not available");
      }
      // Use SDK mutation — handles cache update via buildProfileMetadata (proper deep merge)
      await sdkUpdateProfile({
        profile: nextProfile,
      });

      return nextProfile;
    },
    onSuccess: () => {
      success(i18next.t("g.success"));
    },
    onError: () => {
      error(i18next.t("g.server-error"));
    },
  });
}
