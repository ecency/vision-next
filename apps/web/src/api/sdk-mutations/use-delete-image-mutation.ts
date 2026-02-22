"use client";

import { useDeleteImage } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

/**
 * Web wrapper for SDK useDeleteImage hook.
 *
 * Automatically provides username and auth token from active account.
 *
 * @param onSuccess - Optional callback on successful deletion
 * @param onError - Optional callback on error
 *
 * @example
 * const deleteImageMutation = useDeleteImageMutation();
 * deleteImageMutation.mutate({ imageId: '123' });
 */
export function useDeleteImageMutation(
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;

  return useDeleteImage(username, code, onSuccess, onError);
}
