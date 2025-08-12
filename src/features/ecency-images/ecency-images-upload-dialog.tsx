import i18next from "i18next";
import { Modal, ModalBody, ModalHeader, Button } from "../ui";
import { EcencyImagesUploadForm } from "./ecency-images-upload-form";
import { useState, useRef } from "react";
import { UilCheck } from "@tooni/iconscout-unicons-react";
import { Spinner } from "@ui/spinner";
import { useUploadPostImage } from "@/api/mutations";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onPick: (link: string) => void;
}

interface UploadItem {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done";
}

export function EcencyImagesUploadDialog({ show, setShow, onPick }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const { mutateAsync: upload } = useUploadPostImage();
  const cancelRef = useRef(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const startUpload = async () => {
    cancelRef.current = false;
    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) {
        break;
      }

      setItems((prev) => {
        if (cancelRef.current || !prev[i]) {
          return prev;
        }
        const next = [...prev];
        next[i].status = "uploading";
        return next;
      });

      const { url } = await upload({ file: items[i].file });
      if (cancelRef.current) {
        break;
      }

      onPick(url);

      setItems((prev) => {
        if (cancelRef.current || !prev[i]) {
          return prev;
        }
        const next = [...prev];
        next[i].status = "done";
        return next;
      });
    }

    if (!cancelRef.current) {
      setItems([]);
      setShow(false);
    }

    setIsCancelling(false);
    cancelRef.current = false;
  };

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      centered={true}
      size={items.length ? "lg" : "md"}
    >
      <ModalHeader closeButton={true}>{i18next.t("ecency-images.upload-image")}</ModalHeader>
      <ModalBody>
        {!items.length && (
          <EcencyImagesUploadForm
            onFilesPick={(files) =>
              setItems((prev) => [
                ...prev,
                ...files.map((file) => ({
                  file,
                  preview: URL.createObjectURL(file),
                  status: "pending" as const
                }))
              ])
            }
          />
        )}
        {items.length > 0 && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item, i) => (
                <div key={i} className="relative">
                  <img className="w-full" src={item.preview} alt={item.file.name} />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Spinner className="w-6 h-6" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute top-1 right-1 text-green-500">
                      <UilCheck className="w-5 h-5" />
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
                  }
                  setItems([]);
                }}
              >
                {i18next.t("g.cancel")}
              </Button>
              <Button
                size="sm"
                isLoading={items.some((it) => it.status === "uploading")}
                onClick={startUpload}
                disabled={isCancelling}
              >
                {i18next.t("editor-toolbar.upload")}
              </Button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
