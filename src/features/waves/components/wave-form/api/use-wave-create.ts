import { useMutation } from "@tanstack/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import i18next from "i18next";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useWavesApi } from "./use-waves-api";
import { useCommunityApi } from "./use-community-api";
import { WaveEntry } from "@/entities";

export function useWaveCreate() {
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
        return communityBasedApiRequest({ host, raw, editingEntry });
      }

      const hostEntries = await bridgeApi.getAccountPosts(ProfileFilter.posts, host);

      if (!hostEntries) {
        throw new Error(i18next.t("decks.threads-form.no-threads-host"));
      }

      const entry = hostEntries[0];
      return generalApiRequest({ entry, raw, editingEntry });
    },
    onError: (e) => error(...formatError(e))
  });
}
