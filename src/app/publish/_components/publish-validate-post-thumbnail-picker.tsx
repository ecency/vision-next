import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import i18next from "i18next";
import { useState } from "react";
import { usePublishState } from "../_hooks";

export function PublishValidatePostThumbnailPicker() {
  const { thumbnails, selectedThumbnail, setSelectedThumbnail } = usePublishState();

  const [showPicker, setShowPicker] = useState(false);

  return (
    <div>
      {selectedThumbnail && (
        <div
          className="bg-cover w-full h-[256px] flex items-center justify-center"
          style={{ backgroundImage: `url(${selectedThumbnail})` }}
        >
          <Button size="sm" appearance="gray" onClick={() => setShowPicker(true)}>
            {i18next.t("publish.change-thumb")}
          </Button>
        </div>
      )}

      <Modal centered={true} show={showPicker} onHide={() => setShowPicker(false)}>
        <ModalHeader closeButton={true}>{i18next.t("publish.thumb-selection")}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {thumbnails.map((thumb) => (
              <div
                key={thumb}
                className="w-full aspect-square bg-cover cursor-pointer hover:scale-95 duration-300"
                style={{ backgroundImage: `url(${thumb})` }}
                onClick={() => {
                  setSelectedThumbnail(thumb);
                  setShowPicker(false);
                }}
              />
            ))}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
