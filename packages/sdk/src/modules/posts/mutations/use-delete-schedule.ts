import { useMutation } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { deleteSchedule } from "@/modules/private-api/requests";

export function useDeleteSchedule(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "schedules", "delete", username],
    mutationFn: async ({ id }: { id: string }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for deleteSchedule");
      }
      return deleteSchedule(code, id);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: ["posts", "schedules", username],
      });
    },
    onError,
  });
}
