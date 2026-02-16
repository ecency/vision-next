import { useMutation } from "@tanstack/react-query";
import { getQueryClient, QueryKeys } from "@/modules/core";
import { addSchedule } from "@/modules/private-api/requests";

export function useAddSchedule(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: () => void,
  onError?: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["posts", "schedules", "add", username],
    mutationFn: async ({
      permlink,
      title,
      body,
      meta,
      options,
      schedule,
      reblog,
    }: {
      permlink: string;
      title: string;
      body: string;
      meta: Record<string, unknown>;
      options: Record<string, unknown> | null;
      schedule: string;
      reblog: boolean;
    }) => {
      if (!username || !code) {
        throw new Error("[SDK][Posts] – missing auth for addSchedule");
      }
      return addSchedule(code, permlink, title, body, meta, options, schedule, reblog);
    },
    onSuccess: () => {
      onSuccess?.();
      getQueryClient().invalidateQueries({
        queryKey: QueryKeys.posts.schedules(username),
      });
    },
    onError,
  });
}
