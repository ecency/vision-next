import { useMutation } from "@tanstack/react-query";
import { Entry, WaveEntry } from "@/entities";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { useThreadsApi } from "./use-threads-api";

export function useWaveCreateReply() {
  const { mutateAsync: generalApiRequest } = useThreadsApi();

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
    }) => {
      try {
        return await generalApiRequest({ entry: parent, raw, editingEntry });
      } catch (e) {
        error(...formatError(e));
        throw e;
      }
    }
  });
}
