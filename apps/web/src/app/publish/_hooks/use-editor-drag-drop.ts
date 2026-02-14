import { useUploadImageMutation } from "@/api/sdk-mutations";
import { error, info } from "@/features/shared";
import { Editor } from "@tiptap/core";
import i18next from "i18next";
import { useCallback, useEffect } from "react";
import { useOptionalUploadTracker } from "./use-upload-tracker";

export function useEditorDragDrop(editor: Editor | null) {
  const { mutateAsync: upload } = useUploadImageMutation();
  const uploadTracker = useOptionalUploadTracker();

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const files = event.dataTransfer?.files;
      if (files?.length === 0) {
        return;
      }

      const file = files![0];
      if (!file.type.startsWith("image/")) {
        error(i18next.t("publish.no-image-found"));
        return;
      }

      info(i18next.t("publish.upload-started"));

      // Track upload if tracker is available
      const uploadId = `drag-drop-${Date.now()}-${Math.random()}`;
      const abortController = new AbortController();
      uploadTracker?.registerUpload(uploadId, abortController);

      try {
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
      } catch (err) {
        uploadTracker?.markFailed(uploadId);
        throw err;
      }
    },
    [editor, upload, uploadTracker]
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  // Handle files drag and dropping
  useEffect(() => {
    const dom = editor?.view.dom;
    dom?.addEventListener("drop", handleDrop);
    dom?.addEventListener("dragover", handleDragOver);

    return () => {
      dom?.removeEventListener("drop", handleDrop);
      dom?.removeEventListener("dragover", handleDragOver);
    };
  }, [editor, handleDragOver, handleDrop]);
}
