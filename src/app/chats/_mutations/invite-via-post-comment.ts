import { useMutation } from "@tanstack/react-query";
import { useGlobalStore } from "@/core/global-store";
import { getAccountPostsQuery } from "@/api/queries";
import { useCreateReply } from "@/api/mutations";
import { createReplyPermlink } from "@/utils";
import { error } from "@/features/shared";
import i18next from "i18next";
import { useMemo } from "react";
import useMount from "react-use/lib/useMount";

export function useInviteViaPostComment(username: string) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { data, refetch } = getAccountPostsQuery(username).useClientQuery();

  const posts = useMemo(() => data?.pages[0] ?? [], [data]);

  const { mutateAsync: addReply } = useCreateReply(posts[0], posts[0]);

  useMount(() => refetch());

  return useMutation({
    mutationKey: ["chats/invite-via-post-comment"],
    mutationFn: async (text: string) => {
      if (posts[0]) {
        const author = activeUser!!.username;
        const permlink = createReplyPermlink(author);
        return addReply({
          text,
          permlink,
          jsonMeta: {},
          point: false
        });
      } else {
        error(i18next.t("chat.no-posts-for-invite"));
        throw new Error(i18next.t("chat.no-posts-for-invite"));
      }
    }
  });
}
