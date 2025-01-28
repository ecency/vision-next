import { Entry, WaveEntry } from "@/entities";
import { useWaveCreate } from "@/features/waves/components/wave-form/api";
import { useWaveCreateReply } from "@/features/waves/components/wave-form/api/use-wave-create-reply";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import { useGlobalStore } from "@/core/global-store";
import { useMutation } from "@tanstack/react-query";

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

      if (image) {
        content = `${content}<br>![${imageName ?? ""}](${image})`;
      }

      if (video) {
        content = `${content}<br>${video}`;
      }

      // Push to draft built content with attachments
      if (text!!.length > 255) {
        setLocalDraft({
          ...localDraft,
          body: content
        });
        window.open("/submit", "_blank");
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
      if (item) {
        onSuccess?.(item);
      }
    }
  });
}
