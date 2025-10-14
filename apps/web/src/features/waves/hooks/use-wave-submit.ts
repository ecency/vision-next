"use client";

import { Entry, WaveEntry } from "@/entities";
import { useWaveCreate } from "@/features/waves/components/wave-form/api";
import { useWaveCreateReply } from "@/features/waves/components/wave-form/api/use-wave-create-reply";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import { useGlobalStore } from "@/core/global-store";
import { useMutation } from "@tanstack/react-query";
import { error, success } from "@/features/shared";
import i18next from "i18next";

interface Body {
  text: string;
  image: string;
  imageName: string;
  video: string;
  host: string;
}

export function useWaveSubmit(
  editingEntry?: WaveEntry,
  replySource?: Entry,
  onSuccess?: (item: WaveEntry) => void
) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);

  const { mutateAsync: create } = useWaveCreate();
  const { mutateAsync: createReply } = useWaveCreateReply();

  const [localDraft, setLocalDraft] = useLocalStorage<Record<string, any>>(
    PREFIX + "_local_draft",
    {}
  );

  return useMutation({
    mutationKey: ["wave-form-submit", activeUser, replySource, editingEntry],
    mutationFn: async ({ text, image, imageName, video, host }: Body) => {
      if (!activeUser) {
        toggleUIProp("login");
        return;
      }

      let content = text!!;

      const isReply = Boolean(replySource || editingEntry?.depth || editingEntry?.parent_author);
      const characterLimit = isReply ? 750 : 250;
      const textLength = text!!.length;

      if (image) {
        content = `${content}<br>![${imageName ?? ""}](${image})`;
      }

      if (video) {
        content = `${content}<br>${video}`;
      }

      // Push to draft built content with attachments
      if (!isReply && textLength > characterLimit) {
        setLocalDraft({
          ...localDraft,
          body: content
        });
        window.open("/publish", "_blank");
        return;
      }

      if (isReply && textLength > characterLimit) {
        error(i18next.t("decks.threads-form.max-length"));
        return;
      }

      let threadItem: WaveEntry;

      if (content === editingEntry?.body) {
        return;
      }

      if (replySource) {
        threadItem = (await createReply({
          parent: replySource,
          raw: content,
          editingEntry: editingEntry
        })) as WaveEntry;
      } else {
        const { entry } = await create({
          host,
          raw: content,
          editingEntry
        });
        threadItem = entry;
      }

      if (host) {
        threadItem.host = host;
      }
      threadItem.id = threadItem.post_id;

      return threadItem;
    },
    onSuccess: (item) => {
      if (editingEntry) {
        success(i18next.t("waves.success-reply-edit"));
      }
      if (item) {
        onSuccess?.(item);
      }
    }
  });
}
