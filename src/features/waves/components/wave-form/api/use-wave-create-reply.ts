import { useMutation } from "@tanstack/react-query";
import { Entry, WaveEntry } from "@/entities";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useWavesApi } from "./use-waves-api";

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
    onError: (e) => error(...formatError(e))
  });
}
