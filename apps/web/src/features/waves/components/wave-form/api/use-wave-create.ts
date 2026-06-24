"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountPostsQueryOptions, QueryKeys } from "@ecency/sdk";
import { ProfileFilter } from "@/enums";
import i18next from "i18next";
import { error } from "@/features/shared";
import { formatError } from "@/api/format-error";
import { useWavesApi } from "./use-waves-api";
import { useCommunityApi } from "./use-community-api";
import { WaveEntry } from "@/entities";

export function useWaveCreate() {
  const queryClient = useQueryClient();

  const { mutateAsync: generalApiRequest } = useWavesApi();
  const { mutateAsync: communityBasedApiRequest } = useCommunityApi();

  return useMutation({
    mutationKey: ["wave-create"],
    mutationFn: async ({
      host,
      raw,
      editingEntry,
      videoThumbnail
    }: {
      host: string;
      raw: string;
      editingEntry?: WaveEntry;
      videoThumbnail?: string;
    }) => {
      if (host === "dbuzz") {
        return {
          host,
          entry: (await communityBasedApiRequest({ host, raw, editingEntry, videoThumbnail })) as WaveEntry
        };
      }

      const hostEntries = await queryClient.fetchQuery(
        getAccountPostsQueryOptions(host, ProfileFilter.posts)
      );

      if (!hostEntries) {
        throw new Error(i18next.t("decks.threads-form.no-threads-host"));
      }

      const entry = hostEntries[0];
      return {
        host,
        entry: (await generalApiRequest({ entry, raw, editingEntry, host, videoThumbnail })) as WaveEntry,
        isEditing: !!editingEntry
      };
    },
    onSuccess: ({ host, entry, isEditing }) => {
      if (isEditing) {
        return;
      }

      const prependToFirstPage = (data?: InfiniteData<WaveEntry[]>) => {
        if (!data) {
          return data;
        }

        // Skip if the wave is already in the cache (e.g. the 60s auto-refresh
        // poll already rewrote page 0), so we never render it twice. A wave is
        // uniquely identified by author + permlink (entry.id is not reliable).
        const alreadyPresent = data.pages.some((page) =>
          page.some(
            (existing) =>
              existing.author === entry.author && existing.permlink === entry.permlink
          )
        );

        if (alreadyPresent) {
          return data;
        }

        return {
          ...data,
          pages: data.pages.map((page, index) =>
            index === 0 ? [entry, ...page] : page
          )
        };
      };

      // The live Waves list is now the combined cross-container feed; show the
      // new wave at the top of it immediately.
      queryClient.setQueryData<InfiniteData<WaveEntry[]>>(
        QueryKeys.posts.wavesFeed({}),
        prependToFirstPage
      );
      // Legacy single-host feed (decks) kept in sync.
      queryClient.setQueryData<InfiniteData<WaveEntry[]>>(
        QueryKeys.posts.wavesByHost(host),
        prependToFirstPage
      );
    },
    onError: (e) => error(...formatError(e))
  });
}
