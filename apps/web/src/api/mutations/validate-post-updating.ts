import { useMutation } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { getPost } from "@/api/bridge";

export function useValidatePostUpdating() {
  return useMutation({
    mutationKey: ["validate-post-updating"],
    mutationFn: async ({ entry, text, title }: { entry: Entry; text: string; title?: string }) => {
      const response = await getPost(entry.author, entry.permlink);

      if (title && response?.title !== title) {
        throw new Error("[PostUpdateValidation] Post title isn`t matching yet");
      }

      if (response?.body !== text) {
        throw new Error("[PostUpdateValidation] Post text isn`t matching yet");
      }
    },
    retry: 3,
    retryDelay: 3000
  });
}
