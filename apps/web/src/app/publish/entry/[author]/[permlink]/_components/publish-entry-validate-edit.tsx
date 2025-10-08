import { PublishValidatePostMeta } from "@/app/publish/_components/publish-validate-post-meta";
import { usePublishState } from "@/app/publish/_hooks";
import { TagSelector } from "@/app/submit/_components";
import { Button } from "@/features/ui";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import { usePostEdit } from "../_hooks";
import { useCallback } from "react";
import { PublishValidatePostThumbnailPicker } from "@/app/publish/_components/publish-validate-post-thumbnail-picker";
import { Entry } from "@/entities";

interface Props {
  entry: Entry | undefined;
  onClose: () => void;
  onSuccess: (step: "updated") => void;
}

export function PublishEntryValidateEdit({ onClose, onSuccess, entry }: Props) {
  const { tags, setTags, title, metaDescription, selectedThumbnail, content } = usePublishState();

  const { mutateAsync: editPost, isPending: isEditPending } = usePostEdit(entry);

  const submit = useCallback(async () => {
    await editPost({
      title: title!,
      description: metaDescription!,
      selectedThumbnail: selectedThumbnail!,
      body: content!,
      tags: tags!
    });

    onSuccess("updated");
  }, [metaDescription, onSuccess, selectedThumbnail, tags, title]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="publish-page max-w-[1024px] mx-auto"
    >
      <div className="col-span-2 justify-end flex p-4 pt-0 md:pt-4">
        <Button
          appearance="gray"
          icon={<UilMultiply />}
          size="sm"
          className="h-[36px]"
          onClick={onClose}
        />
      </div>
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-8 bg-white rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="text-lg font-semibold mb-4">{i18next.t("publish.story-preview")}</div>
          <PublishValidatePostThumbnailPicker />
          <PublishValidatePostMeta />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {i18next.t("publish.public-info-hint")}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8 items-start">
          <div className="flex items-center gap-2">
            <span className="opacity-75">{i18next.t("decks.threads-form.thread-host")}</span>
            <div className="font-semibold flex items-center gap-2">
              {/* {community && <UserAvatar username={communityTag ?? ""} size="small" />} */}
              {/* {community?.title ?? "My blog"} */}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("publish.tags-hint")}
            </div>
            <TagSelector
              tags={tags ?? []}
              maxItem={10}
              onChange={(tags) => setTags(tags)}
              onValid={() => {}}
            />
            {!tags?.length && (
              <div className="text-sm text-red">{i18next.t("publish.tags-min-message")}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              disabled={!tags?.length || isEditPending}
              onClick={submit}
              isLoading={isEditPending}
            >
              {isEditPending ? i18next.t("submit.updating") : i18next.t("submit.update")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
