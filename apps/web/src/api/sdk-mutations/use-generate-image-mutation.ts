"use client";

import { useGenerateImage } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

/**
 * Web-specific AI image generation mutation hook.
 *
 * Wraps the SDK's useGenerateImage mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Passes access token for private API auth
 */
export function useGenerateImageMutation() {
  const username = useActiveUsername();
  const accessToken = username ? getAccessToken(username) : undefined;
  return useGenerateImage(username, accessToken);
}
