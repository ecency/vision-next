"use client";

import { useMutePost, type MutePostPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific mute post mutation hook using SDK.
 *
 * Wraps the SDK's useMutePost mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates community posts, post cache, and feed cache after muting
 *
 * @returns Mutation result with mute post function from SDK
 *
 * @example
 * ```typescript
 * const MutePostButton = ({ community, author, permlink }) => {
 *   const { mutateAsync: mutePost, isPending } = useMutePostMutation();
 *
 *   const handleMute = async () => {
 *     try {
 *       await mutePost({
 *         community: 'hive-123456',
 *         author,
 *         permlink,
 *         notes: 'Violates community guidelines',
 *         mute: true
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   const handleUnmute = async () => {
 *     try {
 *       await mutePost({
 *         community: 'hive-123456',
 *         author,
 *         permlink,
 *         notes: 'Resolved',
 *         mute: false
 *       });
 *       // Success! Post restored and cache updated
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleMute} disabled={isPending}>Mute</button>
 *       <button onClick={handleUnmute} disabled={isPending}>Unmute</button>
 *     </>
 *   );
 * };
 * ```
 */
export function useMutePostMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useMutePost mutation with web adapter
  return useMutePost(username, {
    adapter,
  });
}
