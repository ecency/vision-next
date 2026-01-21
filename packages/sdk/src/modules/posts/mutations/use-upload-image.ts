import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "@/modules/private-api/requests";

/**
 * Hook to upload an image file to Ecency image hosting
 *
 * @param onSuccess - Optional callback on successful upload, receives { url: string }
 * @param onError - Optional callback on error
 *
 * Note: This hook uploads to Ecency's image server and requires a signature token.
 * The token should be generated using the user's posting key signature.
 *
 * @example
 * const uploadMutation = useUploadImage(
 *   (data) => console.log('Uploaded:', data.url)
 * );
 * uploadMutation.mutate({ file, token });
 */
export function useUploadImage(
  onSuccess?: (data: { url: string }) => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "images", "upload"],
    mutationFn: async ({
      file,
      token,
      signal,
    }: {
      file: File;
      token: string;
      signal?: AbortSignal;
    }) => {
      return uploadImage(file, token, signal);
    },
    onSuccess,
    onError,
  });
}
