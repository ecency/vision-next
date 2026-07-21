import { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { useUploadAndInsertImages } from "./use-upload-and-insert-images";

export function useEditorDragDrop(editor: Editor | null) {
  const uploadAndInsert = useUploadAndInsertImages(editor);

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) {
        return;
      }

      await uploadAndInsert(files, "drag-drop");
    },
    [uploadAndInsert]
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
