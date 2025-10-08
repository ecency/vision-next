"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import i18next from "i18next";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useWavesApi } from "./use-waves-api";
import { useCommunityApi } from "./use-community-api";
import { WaveEntry } from "@/entities";
import { QueryIdentifiers } from "@/core/react-query";

export function useWaveCreate() {
  const queryClient = useQueryClient();

  const { mutateAsync: generalApiRequest } = useWavesApi();
  const { mutateAsync: communityBasedApiRequest } = useCommunityApi();

  return useMutation({
    mutationKey: ["wave-create"],
    mutationFn: async ({
      host,
      raw,
      editingEntry
    }: {
      host: string;
      raw: string;
      editingEntry?: WaveEntry;
    }) => {
      if (host === "dbuzz") {
        return {
          host,
          entry: (await communityBasedApiRequest({ host, raw, editingEntry })) as WaveEntry
        };
      }

      const hostEntries = await bridgeApi.getAccountPosts(ProfileFilter.posts, host);

      if (!hostEntries) {
        throw new Error(i18next.t("decks.threads-form.no-threads-host"));
      }

      const entry = hostEntries[0];
      return {
        host,
        entry: (await generalApiRequest({ entry, raw, editingEntry, host })) as WaveEntry,
        isEditing: !!editingEntry
      };
    },
    onSuccess: ({ host, entry, isEditing }) => {
      if (isEditing) {
        return;
      }

      queryClient.setQueryData<InfiniteData<WaveEntry[]>>(
        [QueryIdentifiers.THREADS, host],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            ...data,
            pages: data.pages.map((page, index) => (index === 0 ? [entry, ...page] : page))
          };
        }
      );
    },
    onError: (e) => error(...formatError(e))
  });
}
