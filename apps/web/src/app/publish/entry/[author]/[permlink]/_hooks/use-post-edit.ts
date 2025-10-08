import { useMutation } from "@tanstack/react-query";
import { comment, formatError } from "@/api/operations";
import dayjs from "@/utils/dayjs";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { useGlobalStore } from "@/core/global-store";
import { Entry } from "@/entities";
import { correctIsoDate, makeEntryPath } from "@/utils";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useValidatePostUpdating } from "@/api/mutations/validate-post-updating";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { SUBMIT_DESCRIPTION_MAX_LENGTH } from "@/app/submit/_consts";

export function usePostEdit(entry: Entry | undefined) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const router = useRouter();

  const { mutateAsync: validatePostUpdating } = useValidatePostUpdating();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "post-updated"
  );

  return useMutation({
    mutationKey: ["update-entry", entry?.author, entry?.permlink],
    mutationFn: async ({
      title,
      tags,
      body,
      description,
      selectedThumbnail
    }: {
      title: string;
      tags: string[];
      body: string;
      description?: string;
      selectedThumbnail?: string;
    }) => {
      if (!entry) {
        return;
      }

      const { author, permlink, category, json_metadata } = entry;
      const newBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .buildPatchFrom(entry, body);
      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .extend(entry)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(description || postBodySummary(body, SUBMIT_DESCRIPTION_MAX_LENGTH))
        .withTags(tags)
        .withPoll()
        .withSelectedThumbnail(selectedThumbnail);

      const jsonMeta = metaBuilder.build();

      await comment(activeUser?.username!, "", category, permlink, title, newBody, jsonMeta, null);

      try {
        await validatePostUpdating({ entry, title, text: newBody });
      } catch (e) {}

      updateEntryQueryData([
        {
          ...entry,
          title,
          body,
          category: tags[0],
          json_metadata: jsonMeta,
          updated: correctIsoDate(dayjs().toISOString())
        }
      ]);

      recordActivity();

      success(i18next.t("submit.updated"));
      const newLoc = makeEntryPath(category, author, permlink);
      router.push(newLoc);
    },
    onError: (e) => {
      error(...formatError(e));
    }
  });
}
