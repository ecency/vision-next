import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { getPostQueryOptions } from "@ecency/sdk";

export function useValidatePostUpdating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["validate-post-updating"],
    mutationFn: async ({ entry, text, title }: { entry: Entry; text: string; title?: string }) => {
      const response = await queryClient.fetchQuery(
        getPostQueryOptions(entry.author, entry.permlink)
      );

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
