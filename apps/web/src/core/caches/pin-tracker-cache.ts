import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "../react-query";
import { QueryKeys } from "@ecency/sdk";
import { formatError } from "@/api/format-error";
import { usePinPostMutation } from "@/api/sdk-mutations";
import { Community, Entry } from "@/entities";
import { clone } from "remeda";
import { error, success } from "@/features/shared";
import i18next from "i18next";

// The pin flag is already carried per-entry on `entry.stats.is_pinned` (same
// bridge.get_ranked_posts source that stamped it), so we no longer fetch a whole
// community ranked list per card just to derive it (that was an extra network
// call + query observer on every card in the feed). Kept as a LIVE observer on
// the ENTRY_PIN_TRACK key, seeded from entry.stats, so the optimistic
// setQueryData in useCommunityPin (below) still flips the in-menu pin label.
export function useCommunityPinCache(entry: Entry) {
  return useQuery({
    queryKey: [QueryIdentifiers.ENTRY_PIN_TRACK, entry.post_id],
    queryFn: () => entry.stats?.is_pinned ?? false,
    initialData: entry.stats?.is_pinned ?? false,
    staleTime: Infinity
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
