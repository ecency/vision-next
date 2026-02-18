"use client";

import { useDeleteImage } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
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
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;

  return useDeleteImage(activeUser?.username, code, onSuccess, onError);
}
