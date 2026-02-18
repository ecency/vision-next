"use client";

import { useUpdateCommunity, type UpdateCommunityPayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific update community mutation hook using SDK.
 *
 * Wraps the SDK's useUpdateCommunity mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates community cache after updating properties
 *
 * @param community - Community name (e.g., "hive-123456")
 *
 * @returns Mutation result with updateCommunity function from SDK
 *
 * @example
 * ```typescript
 * const UpdateCommunityForm = ({ community }) => {
 *   const { mutateAsync: updateCommunity, isPending } = useUpdateCommunityMutation(community.name);
 *
 *   const handleSubmit = async (formData) => {
 *     try {
 *       await updateCommunity({
 *         title: formData.title,
 *         about: formData.about,
 *         lang: formData.lang,
 *         description: formData.description,
 *         flag_text: formData.flag_text,
 *         is_nsfw: formData.is_nsfw
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * };
 * ```
 */
export function useUpdateCommunityMutation(community: string) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useUpdateCommunity mutation with web adapter
  return useUpdateCommunity(community, username, {
    adapter,
  });
}
