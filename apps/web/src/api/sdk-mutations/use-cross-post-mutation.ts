"use client";

import { useCrossPost, type CrossPostPayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific cross-post mutation hook using SDK.
 *
 * Wraps the SDK's useCrossPost mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates feed/blog caches after cross-posting
 *
 * @returns Mutation result with cross-post function from SDK
 *
 * @example
 * ```typescript
 * const CrossPostButton = ({ entry, community }) => {
 *   const { mutateAsync: crossPost, isPending } = useCrossPostMutation();
 *
 *   const handleCrossPost = async (message: string) => {
 *     try {
 *       await crossPost({
 *         author: activeUser.username,
 *         permlink: `${entry.permlink}-${community.id}`,
 *         parentPermlink: community.id,
 *         title: entry.title,
 *         body: makeCrossPostMessage(entry, activeUser.username, message),
 *         jsonMetadata: {
 *           app: makeApp(pack.version),
 *           tags: ['cross-post'],
 *           original_author: entry.author,
 *           original_permlink: entry.permlink
 *         },
 *         options: {
 *           maxAcceptedPayout: '0.000 HBD',
 *           allowCurationRewards: false
 *         }
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={() => handleCrossPost('Check this out!')} disabled={isPending}>Cross-Post</button>;
 * };
 * ```
 */
export function useCrossPostMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useCrossPost mutation with web adapter
  return useCrossPost(username, {
    adapter,
  });
}
