"use client";

import { useMutation } from "@tanstack/react-query";
import { Community, Entry } from "@/entities";
import { formatError, mutePost } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error } from "@/features/shared";

export function useMutePost(entry: Entry, community: Community) {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["mutePost", entry?.author, entry?.permlink],
    mutationFn: ({ notes, mute }: { notes: string; mute: boolean }) =>
      mutePost(activeUser!.username, community.name, entry.author, entry.permlink, notes, mute),
    onError: (err) => error(...formatError(err)),
    onSuccess: () => {
      // TODO: update cache of entries
    }
  });
}
