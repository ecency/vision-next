import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { deleteImage } from "@/modules/private-api/requests";

/**
 * Hook to delete an image from the user's Ecency gallery
 *
 * @param username - Current user's username
 * @param code - Access token for authentication
 * @param onSuccess - Optional callback on successful deletion
 * @param onError - Optional callback on error
 *
 * @example
 * const deleteImageMutation = useDeleteImage(username, code);
 * deleteImageMutation.mutate({ imageId: '123' });
 */
export function useDeleteImage(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "images", "delete", username],
    mutationFn: async ({ imageId }: { imageId: string }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for deleteImage");
      }
      return deleteImage(code, imageId);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "images", username],
      });
    },
    onError,
  });
}
