import React, { useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { Tooltip } from "@ui/tooltip";
import { PopperDropdown } from "@/features/ui";
import i18next from "i18next";
import { videoSvg } from "@ui/svg";
import { EcencyConfigManager } from "@/config";

interface Props {
  onSelect: (video: string) => void;
}

export function DeckThreadsFormToolbarVideoPicker({ onSelect }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [showUpload, setShowUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div className="deck-threads-form-toolbar-video-picker">
      {activeUser && (
        <Tooltip content={i18next.t("editor-toolbar.image")}>
          <PopperDropdown toggle={videoSvg} hideOnClick={true}>
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => setShowUpload(true)}>
                {i18next.t("video-upload.upload-video")}
              </div>
              <EcencyConfigManager.Conditional
                condition={({ thirdPartyFeatures }) =>
                  thirdPartyFeatures.threeSpeak.uploading.enabled
                }
              >
                <div className="dropdown-item" onClick={() => setShowGallery(true)}>
                  {i18next.t("video-upload.video-gallery")}
                </div>
              </EcencyConfigManager.Conditional>
            </div>
          </PopperDropdown>
        </Tooltip>
      )}
      {/*<VideoUpload show={showUpload} setShow={setShowUpload} setShowGallery={setShowGallery} />*/}
      {/*<VideoGallery*/}
      {/*  preFilter="published"*/}
      {/*  showGallery={showGallery}*/}
      {/*  setShowGallery={setShowGallery}*/}
      {/*  insertText={(v) => {*/}
      {/*    onSelect(v);*/}
      {/*  }}*/}
      {/*/>*/}
    </div>
  );
}
