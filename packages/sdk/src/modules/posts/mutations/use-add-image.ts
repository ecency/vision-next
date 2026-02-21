import { useMutation } from "@tanstack/react-query";
import { getQueryClient, QueryKeys } from "@/modules/core";
import { addImage } from "@/modules/private-api/requests";

/**
 * Hook to add an image URL to the user's Ecency gallery
 *
 * @param username - Current user's username
 * @param code - Access token for authentication
 * @param onSuccess - Optional callback on successful addition
 * @param onError - Optional callback on error
 *
 * @example
 * const addImageMutation = useAddImage(username, code);
 * addImageMutation.mutate({ url: 'https://...' });
 */
export function useAddImage(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "images", "add", username],
    mutationFn: async ({ url, code: nextCode }: { url: string; code?: string }) => {
      const effectiveCode = nextCode ?? code;

      if (!username || !effectiveCode) {
        throw new Error("[SDK][Posts] – missing auth for addImage");
      }
      return addImage(effectiveCode, url);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: QueryKeys.posts.images(username),
      });
    },
    onError,
  });
}
