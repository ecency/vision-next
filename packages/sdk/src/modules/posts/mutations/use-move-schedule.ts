import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { moveSchedule } from "@/modules/private-api/requests";

export function useMoveSchedule(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "schedules", "move", username],
    mutationFn: async ({ id }: { id: string }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for moveSchedule");
      }
      return moveSchedule(code, id);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "schedules", username],
      });
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "drafts", username],
      });
    },
    onError,
  });
}
