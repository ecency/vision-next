import React, { useRef, useState } from "react";
import axios from "axios";
import { Button } from "@ui/button";
import { UilImage, UilLink, UilUpload } from "@tooni/iconscout-unicons-react";
import { useGlobalStore } from "@/core/global-store";
import { getAccessToken } from "@/utils";
import { uploadImage } from "@/api/misc";
import { error } from "@/features/shared";
import i18next from "i18next";
import { Tooltip } from "@ui/tooltip";
import { AddImage } from "@/features/shared/editor-toolbar/add-image";
import { GalleryDialog } from "@/features/shared/gallery";
import { EcencyConfigManager } from "@/config";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";

interface Props {
  onAddImage: (link: string, name: string) => void;
}

export const DeckThreadsFormToolbarImagePicker = ({ onAddImage }: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const fileInputRef = useRef<any>();

  const [imagePickInitiated, setImagePickInitiated] = useState(false);
  const [galleryPickInitiated, setGalleryPickInitiated] = useState(false);

  const onImagePick = (text: string, url: string) => {
    onAddImage(url, text);
  };

  const checkFile = (filename: string) => {
    const filenameLow = filename.toLowerCase();
    return ["jpg", "jpeg", "gif", "png", "webp"].some((el) => filenameLow.endsWith(el));
  };

  const fileInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let files = Array.from(e.target.files as FileList)
      .filter((i) => checkFile(i.name))
      .filter((i) => i);

    if (files.length > 0) {
      e.stopPropagation();
      e.preventDefault();
    }

    files.forEach((file) => upload(file));

    // reset input
    e.target.value = "";
  };

  const upload = async (file: File) => {
    const username = activeUser?.username!;
    let imageUrl: string;
    try {
      let token = getAccessToken(username);
      if (token) {
        const resp = await uploadImage(file, token);
        imageUrl = resp.url;
        onAddImage(imageUrl, file.name);
      } else {
        error(i18next.t("editor-toolbar.image-error-cache"));
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 413) {
        error(i18next.t("editor-toolbar.image-error-size"));
      } else {
        error(i18next.t("editor-toolbar.image-error"));
      }
      return;
    }
  };

  return (
    <div className="deck-threads-form-toolbar-image-picker">
      {activeUser && (
        <Tooltip content={i18next.t("editor-toolbar.image")}>
          <Dropdown>
            <DropdownToggle>
              <Button icon={<UilImage />} appearance="gray-link" noPadding={true} />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItemWithIcon
                onClick={() => setImagePickInitiated(true)}
                icon={<UilLink />}
                label={i18next.t("editor-toolbar.link-image")}
              />
              <DropdownItemWithIcon
                onClick={(e) => {
                  e.stopPropagation();
                  const el = fileInputRef.current;
                  if (el) el.click();
                }}
                icon={<UilUpload />}
                label={i18next.t("editor-toolbar.upload")}
              />
              <EcencyConfigManager.Conditional
                condition={({ visionFeatures }) => visionFeatures.gallery.enabled}
              >
                <DropdownItemWithIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryPickInitiated(true);
                  }}
                  icon={<UilImage />}
                  label={i18next.t("editor-toolbar.gallery")}
                />
              </EcencyConfigManager.Conditional>
            </DropdownMenu>
          </Dropdown>
        </Tooltip>
      )}
      {imagePickInitiated && (
        <AddImage
          onHide={() => setImagePickInitiated(false)}
          onSubmit={(text: string, link: string) => {
            onImagePick(text, link);
            setImagePickInitiated(false);
          }}
        />
      )}
      {galleryPickInitiated && activeUser && (
        <GalleryDialog
          show={galleryPickInitiated}
          setShow={setGalleryPickInitiated}
          onPick={(url: string) => {
            const fileName = "";
            onImagePick(fileName, url);
            setGalleryPickInitiated(false);
          }}
        />
      )}
      <input
        onChange={fileInputChanged}
        className="file-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={true}
        style={{ display: "none" }}
      />
    </div>
  );
};
