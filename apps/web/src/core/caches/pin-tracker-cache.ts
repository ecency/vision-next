import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "../react-query";
import { getPostsRankedQueryOptions, QueryKeys } from "@ecency/sdk";
import { useDataLimit } from "@/utils/data-limit";
import { formatError } from "@/api/format-error";
import { usePinPostMutation } from "@/api/sdk-mutations";
import { Community, Entry } from "@/entities";
import { isCommunity } from "@/utils";
import { clone } from "remeda";
import { error, success } from "@/features/shared";
import i18next from "i18next";

export function useCommunityPinCache(entry: Entry) {
  const dataLimit = useDataLimit();
  const { data: rankedPosts } = useQuery({
    ...getPostsRankedQueryOptions(
      "created",
      "",
      "",
      dataLimit,
      entry.category,
      "",
      isCommunity(entry.category)
    )
  });

  return useQuery({
    queryKey: [QueryIdentifiers.ENTRY_PIN_TRACK, entry.post_id],
    queryFn: async () =>
      rankedPosts?.find(
        (x) =>
          x.author === entry.author && x.permlink === entry.permlink && x.stats?.is_pinned === true
      ) !== undefined,
    initialData: entry.stats?.is_pinned ?? false
  });
}

export function useCommunityPin(entry: Entry, community: Community | null | undefined) {
  const queryClient = useQueryClient();
  const pinPostMutation = usePinPostMutation();

  return useMutation({
    mutationKey: ["PIN_COMMUNITY"],
    mutationFn: (pin: boolean) =>
      pinPostMutation.mutateAsync({
        community: community!.name,
        account: entry.author,
        permlink: entry.permlink,
        pin
      }),
    onError: (e) => error(...formatError(e)),
    onSuccess: (_data, pin) => {
      if (pin) {
        success(i18next.t("entry-menu.pin-success"));
      } else {
        success(i18next.t("entry-menu.unpin-success"));
      }

      queryClient.setQueryData([QueryIdentifiers.ENTRY_PIN_TRACK, entry.post_id], pin);

      queryClient.setQueryData<Entry>(
        QueryKeys.posts.entry(`/@${entry.author}/${entry.permlink}`),
        (data) => {
          if (!data) {
            return data;
          }

          const updatedStats: Entry["stats"] = data.stats
            ? { ...clone(data.stats), is_pinned: pin }
            : data.stats;

          return { ...clone(data), stats: updatedStats };
        }
      );
    }
  });
}
