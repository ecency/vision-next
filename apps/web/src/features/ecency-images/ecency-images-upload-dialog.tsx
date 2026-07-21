import i18next from "i18next";
import { Modal, ModalBody, ModalHeader, Button } from "../ui";
import { EcencyImagesUploadForm } from "./ecency-images-upload-form";
import { useState, useRef, useEffect, useCallback } from "react";
import { UilCheck } from "@tooni/iconscout-unicons-react";
import { Spinner } from "@ui/spinner";
import { useUploadImageMutation } from "@/api/sdk-mutations";
// Import the tracker directly, not through the "@/app/publish/_hooks" barrel:
// the barrel re-exports the whole TipTap editor graph, which this dialog does
// not need
import { nextUploadId, useOptionalUploadTracker } from "@/app/publish/_hooks/use-upload-tracker";
import { convertHeicToJpeg } from "@/utils/convert-heic";
import { isAcceptedImageFile } from "@/utils/image-upload-formats";
import { error } from "@/features/shared";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onPick: (link: string) => void;
  /**
   * Files already picked outside the dialog (e.g. by the toolbar file input).
   * They are seeded as previews when the dialog opens, so the user does not
   * have to pick them twice.
   */
  initialFiles?: File[];
}

interface UploadItem {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done";
  uploadId?: string;
  abortController?: AbortController;
}

export function EcencyImagesUploadDialog({ show, setShow, onPick, initialFiles }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const { mutateAsync: upload } = useUploadImageMutation();
  const uploadTracker = useOptionalUploadTracker();
  const cancelRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // A single image skips the review step, so it has no Upload button to press
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const itemsRef = useRef<UploadItem[]>([]);
  // Read at resolution time, so a result cannot outrun the close it raced
  const showRef = useRef(show);
  showRef.current = show;
  const seededFilesRef = useRef<File[] | undefined>(undefined);

  // Keep track of current items for cleanup
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Cleanup blob URLs only on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  // Stop the request itself, not just the loop around it: a cancelled upload
  // that keeps running holds the publish flow open until the network resolves
  const abortInFlight = useCallback((list: UploadItem[]) => {
    list.forEach((item) => {
      if (item.status === "uploading") {
        item.abortController?.abort();
      }
    });
  }, []);

  // Closing has to cancel here, not in the effect that reacts to `show` turning
  // false: that effect is a render behind, and an upload resolving in the gap
  // would still insert its image into an editor the user had moved on from
  const cancelAndClose = useCallback(() => {
    cancelRef.current = true;
    abortInFlight(itemsRef.current);
    setShow(false);
  }, [abortInFlight, setShow]);

  const startUpload = useCallback(
    async (list: UploadItem[]) => {
      cancelRef.current = false;
      for (let i = 0; i < list.length; i++) {
        if (cancelRef.current) {
          break;
        }

        // Register upload and create abort controller
        const uploadId = nextUploadId("dialog");
        const abortController = new AbortController();
        uploadTracker?.registerUpload(uploadId, abortController);

        setItems((prev) => {
          if (cancelRef.current || !prev[i]) {
            return prev;
          }
          const next = [...prev];
          next[i].status = "uploading";
          next[i].uploadId = uploadId;
          next[i].abortController = abortController;
          return next;
        });

        try {
          const { url } = await upload({ file: list[i].file, signal: abortController.signal });
          if (cancelRef.current || !showRef.current) {
            uploadTracker?.markFailed(uploadId);
            break;
          }

          uploadTracker?.markComplete(uploadId);
          onPick(url);

          setItems((prev) => {
            if (cancelRef.current || !prev[i]) {
              return prev;
            }
            const next = [...prev];
            next[i].status = "done";
            return next;
          });
        } catch {
          uploadTracker?.markFailed(uploadId);
          /* handled in mutation */
        }
      }

      if (!cancelRef.current) {
        // Clean up blob URLs before clearing items
        list.forEach((item) => {
          URL.revokeObjectURL(item.preview);
        });
        setItems([]);
        setShow(false);
      }

      setIsCancelling(false);
      cancelRef.current = false;
    },
    [onPick, setShow, upload, uploadTracker]
  );

  const onFilesPick = useCallback(
    async (files: File[]) => {
      // The input `accept` attribute is a hint only - files can still arrive
      // through "All files" in the picker or through a drop
      const accepted = files.filter((file) => isAcceptedImageFile(file));
      if (accepted.length === 0) {
        error(i18next.t("publish.no-image-found"));
        return;
      }

      const converted = await Promise.all(accepted.map((f) => convertHeicToJpeg(f)));
      const picked = converted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const
      }));
      setItems(picked);

      // One image needs no review step - start uploading as soon as it is picked
      if (picked.length === 1) {
        setIsAutoUploading(true);
        try {
          await startUpload(picked);
        } finally {
          setIsAutoUploading(false);
        }
      }
    },
    [startUpload]
  );

  // Seed files picked outside of the dialog, and drop stale previews once closed
  useEffect(() => {
    if (!show) {
      seededFilesRef.current = undefined;
      // Closing the dialog stops the batch, so nothing gets inserted into the
      // editor after the user dismissed it
      cancelRef.current = true;
      abortInFlight(itemsRef.current);
      if (itemsRef.current.length) {
        itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
        setItems([]);
      }
      return;
    }

    if (!initialFiles?.length || seededFilesRef.current === initialFiles) {
      return;
    }
    seededFilesRef.current = initialFiles;
    onFilesPick(initialFiles);
  }, [show, initialFiles, onFilesPick]);

  return (
    <Modal
      show={show}
      onHide={cancelAndClose}
      centered={true}
      size={items.length ? "lg" : "md"}
    >
      <ModalHeader closeButton={true}>{i18next.t("ecency-images.upload-image")}</ModalHeader>
      <ModalBody>
        {!items.length && <EcencyImagesUploadForm onFilesPick={onFilesPick} />}
        {items.length > 0 && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item, i) => (
                <div key={i} className="relative">
                  <img className="w-full" src={item.preview} alt={item.file.name} />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Spinner className="size-6" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute top-1 right-1 text-green-500">
                      <UilCheck className="size-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <Button
                appearance="gray"
                size="sm"
                onClick={() => {
                  if (items.some((it) => it.status === "uploading")) {
                    cancelRef.current = true;
                    setIsCancelling(true);
                    abortInFlight(items);
                  }
                  // Clean up blob URLs before clearing items
                  items.forEach((item) => {
                    URL.revokeObjectURL(item.preview);
                  });
                  setItems([]);
                }}
              >
                {i18next.t("g.cancel")}
              </Button>
              {!isAutoUploading && (
                <Button
                  size="sm"
                  isLoading={items.some((it) => it.status === "uploading")}
                  onClick={() => startUpload(items)}
                  disabled={isCancelling}
                >
                  {i18next.t("editor-toolbar.upload")}
                </Button>
              )}
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
