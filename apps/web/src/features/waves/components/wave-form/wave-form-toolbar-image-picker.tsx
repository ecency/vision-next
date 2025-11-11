import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@ui/button";
import { UilImage, UilLink, UilUpload } from "@tooni/iconscout-unicons-react";
import { useGlobalStore } from "@/core/global-store";
import { getAccessToken } from "@/utils";
import { uploadImage } from "@/api/misc";
import { error } from "@/features/shared";
import i18next from "i18next";
import { AddImage } from "@/features/shared/editor-toolbar/add-image";
import { GalleryDialog } from "@/features/shared/gallery";
import { EcencyConfigManager } from "@/config";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";

interface Props {
  onAddImage: (link: string, name: string) => void;
  disabled?: boolean;
}

export const WaveFormToolbarImagePicker = ({ onAddImage, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUser = useGlobalStore((s) => s.activeUser);

  const [imagePickInitiated, setImagePickInitiated] = useState(false);
  const [galleryPickInitiated, setGalleryPickInitiated] = useState(false);

  const handleImagePick = useCallback(
    (text: string, url: string) => {
      onAddImage(url, text);
    },
    [onAddImage]
  );

  const checkFile = useCallback((filename: string) => {
    const filenameLow = filename.toLowerCase();
    return ["jpg", "jpeg", "gif", "png", "webp"].some((el) => filenameLow.endsWith(el));
  }, []);

  const upload = useCallback(
    async (file: File) => {
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
    },
    [activeUser?.username, onAddImage]
  );

  const fileInputChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let files = Array.from(e.target.files as FileList)
        .filter((i) => checkFile(i.name))
        .filter((i) => i);

      if (files.length > 0) {
        e.stopPropagation();
        e.preventDefault();
      }

      void (async () => {
        for (const file of files) {
          try {
            await upload(file);
          } catch {
            /* handled in upload */
          }
        }
      })();

      // reset input
      e.target.value = "";
    },
    [checkFile, upload]
  );

  return (
    <div className="deck-threads-form-toolbar-image-picker">
      {activeUser && !disabled && (
        <Dropdown>
          <DropdownToggle>
            <Button
              title={i18next.t("editor-toolbar.image")}
              icon={<UilImage />}
              appearance="gray-link"
              noPadding={true}
            />
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItemWithIcon
              onClick={() => setImagePickInitiated(true)}
              icon={<UilLink />}
              label={i18next.t("editor-toolbar.link-image")}
            />
            <DropdownItemWithIcon
              onClick={(e: React.MouseEvent<HTMLElement>) => {
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
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  setGalleryPickInitiated(true);
                }}
                icon={<UilImage />}
                label={i18next.t("editor-toolbar.gallery")}
              />
            </EcencyConfigManager.Conditional>
          </DropdownMenu>
        </Dropdown>
      )}
      {imagePickInitiated && (
        <AddImage
          onHide={() => setImagePickInitiated(false)}
          onSubmit={(text: string, link: string) => {
            handleImagePick(text, link);
            setImagePickInitiated(false);
          }}
        />
      )}
      {galleryPickInitiated && activeUser && (
        <GalleryDialog
          show={galleryPickInitiated}
          setShow={setGalleryPickInitiated}
          onPick={(url) => {
            handleImagePick("", url);
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
