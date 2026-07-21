import { useUploadImageMutation } from "@/api/sdk-mutations";
import { error, info } from "@/features/shared";
import { convertHeicToJpeg } from "@/utils/convert-heic";
import { isAcceptedImageFile } from "@/utils/image-upload-formats";
import { Editor } from "@tiptap/core";
import i18next from "i18next";
import { useCallback } from "react";
import { nextUploadId, useOptionalUploadTracker } from "./use-upload-tracker";

/**
 * Uploads images and inserts them into the editor as they land.
 *
 * Shared by every one-step upload entry point (toolbar single pick, drag and drop)
 * so tracking, HEIC conversion and insertion behave identically. Uploads run one
 * after another to keep insertion order stable and to avoid flooding the image
 * server from a single drop.
 */
export function useUploadAndInsertImages(editor: Editor | null) {
  const { mutateAsync: upload } = useUploadImageMutation();
  const uploadTracker = useOptionalUploadTracker();

  return useCallback(
    async (files: File[], source: string) => {
      const images = files.filter((file) => isAcceptedImageFile(file));
      if (images.length === 0) {
        error(i18next.t("publish.no-image-found"));
        return;
      }

      info(i18next.t("publish.upload-started"));

      for (let i = 0; i < images.length; i++) {
        const uploadId = nextUploadId(source);
        const abortController = new AbortController();
        uploadTracker?.registerUpload(uploadId, abortController);

        try {
          const file = await convertHeicToJpeg(images[i]);
          const { url } = await upload({ file, signal: abortController.signal });
          uploadTracker?.markComplete(uploadId);

          editor
            ?.chain()
            .focus()
            .insertContent([
              { type: "image", attrs: { src: url } },
              { type: "paragraph" },
              { type: "paragraph" }
            ])
            .run();
        } catch (e) {
          // Failures are surfaced by the upload mutation itself
          uploadTracker?.markFailed(uploadId);
        }
      }
    },
    [editor, upload, uploadTracker]
  );
}
