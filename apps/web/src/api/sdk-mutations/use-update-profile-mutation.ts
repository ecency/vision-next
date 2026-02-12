"use client";

import { useAccountUpdate, type AccountProfile } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific account profile update mutation hook using SDK.
 *
 * Wraps the SDK's useAccountUpdate mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates account cache after profile update
 * - Uses account_update2 operation with posting authority
 *
 * @returns Mutation result with updateProfile function from SDK
 *
 * @example
 * ```typescript
 * const ProfileEditor = () => {
 *   const { mutateAsync: updateProfile, isPending } = useUpdateProfileMutation();
 *
 *   const handleSave = async () => {
 *     try {
 *       await updateProfile({
 *         profile: {
 *           name: "John Doe",
 *           about: "Hive enthusiast",
 *           profile_image: "https://...",
 *           cover_image: "https://...",
 *         }
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleSave} disabled={isPending}>Save Profile</Button>;
 * };
 * ```
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
 * - Supports all auth methods via web broadcast adapter
 * - Automatically falls back through auth chain if needed
 *
 * **Cache Management:**
 * - SDK automatically invalidates account cache after successful update
 * - Optimistic updates merged with existing profile data
 */
export function useUpdateProfileMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useAccountUpdate mutation with web adapter
  return useAccountUpdate(username ?? "", {
    adapter,
  });
}
