import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import i18next from "i18next";
import { useState } from "react";
import { usePublishState } from "../_hooks";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";

export function PublishValidatePostThumbnailPicker() {
  const { thumbnails, selectedThumbnail, setSelectedThumbnail, clearSelectedThumbnail } =
    usePublishState();

  const [showPicker, setShowPicker] = useState(false);

  return thumbnails?.length > 0 ? (
    <div>
      <div
        className={clsx(
          "bg-cover w-full h-[256px] flex gap-2 items-center justify-center",
          !selectedThumbnail && "border border-[--border-color]"
        )}
        style={selectedThumbnail ? { backgroundImage: `url(${selectedThumbnail})` } : {}}
      >
        <Button size="sm" appearance="gray" onClick={() => setShowPicker(true)}>
          {i18next.t("publish.change-thumb")}
        </Button>
        {selectedThumbnail && (
          <Button
            size="sm"
            appearance="gray"
            onClick={() => clearSelectedThumbnail()}
            icon={<UilTrash />}
          />
        )}
      </div>

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
  ) : (
    <></>
  );
}
