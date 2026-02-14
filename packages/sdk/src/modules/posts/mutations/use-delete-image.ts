import { useMutation, type InfiniteData } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { deleteImage } from "@/modules/private-api/requests";
import type { UserImage } from "../types";
import type { WrappedResponse } from "@/modules/core/types";

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
    onSuccess: (_data, variables) => {
      onSuccess?.();
      const qc = getQueryClient();
      const { imageId } = variables;

      // Optimistic removal from regular cache
      qc.setQueryData<UserImage[]>(
        ["posts", "images", username],
        (prev) => prev?.filter((img) => img._id !== imageId)
      );

      // Optimistic removal from infinite cache pages
      qc.setQueriesData<InfiniteData<WrappedResponse<UserImage>>>(
        { queryKey: ["posts", "images", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((img) => img._id !== imageId),
            })),
          };
        }
      );
    },
    onError,
  });
}
