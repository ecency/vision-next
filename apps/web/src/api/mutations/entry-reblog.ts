import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlogEntry, Entry } from "@/entities";
import { broadcastPostingJSON, formatError } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { useRecordUserActivity } from "@/api/mutations/record-user-activity";
import { error, info, success } from "@/features/shared";
import i18next from "i18next";
import { QueryIdentifiers } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";

export function useEntryReblog(entry: Entry) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { mutateAsync: recordUserActivity } = useRecordUserActivity();

  const { update: updateReblogsCount } = EcencyEntriesCacheManagement.useUpdateReblogsCount(entry);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["entryReblog", activeUser?.username, entry.author, entry.permlink],
    mutationFn: async ({ isDelete }: { isDelete: boolean }) => {
      const username = activeUser!.username;
      const message: Record<string, any> = {
        account: username,
        author: entry.author,
        permlink: entry.permlink
      };

      if (isDelete) {
        message["delete"] = "delete";
      }

      const json = ["reblog", message];
      const r = await broadcastPostingJSON(username, "follow", json);
      recordUserActivity({ ty: 130, bl: r.block_num, tx: r.id });
      return [r, isDelete];
    },
    onSuccess: ([_, isDelete]) => {
      isDelete
        ? info(i18next.t("entry-reblog.delete-success"))
        : success(i18next.t("entry-reblog.success"));
      updateReblogsCount((entry.reblogs ?? 0) + (isDelete ? -1 : 1));
      queryClient.setQueryData<BlogEntry[]>(
        [QueryIdentifiers.REBLOGS, activeUser?.username, 200],
        (data) => {
          if (!data) {
            return data;
          }

          return isDelete
            ? data.filter((d) => d.author !== entry.author || d.permlink !== entry.permlink)
            : [
                {
                  entry_id: entry.id ?? 0,
                  blog: activeUser?.username ?? "",
                  post_id: entry.post_id,
                  num: 0,
                  author: entry.author,
                  permlink: entry.permlink,
                  reblogged_on: new Date().toISOString(),
                  created: entry.created
                },
                ...data
              ];
        }
      );
    },
    onError: (e) => error(...formatError(e))
  });
}
