import { useMutation } from "@tanstack/react-query";
import { Entry, WaveEntry } from "@/entities";
import { error, success } from "@/features/shared";
import { formatError } from "@/api/format-error";
import { useWavesApi } from "./use-waves-api";
import i18next from "i18next";

export function useWaveCreateReply() {
  const { mutateAsync: generalApiRequest } = useWavesApi();

  return useMutation({
    mutationKey: ["wave-create-reply"],
    mutationFn: async ({
      editingEntry,
      parent,
      raw
    }: {
      parent: Entry;
      raw: string;
      editingEntry?: WaveEntry;
    }) => generalApiRequest({ entry: parent, raw, editingEntry }),
    onSuccess: () => success(i18next.t("waves.success-reply")),
    onError: (e) => error(...formatError(e))
  });
}
