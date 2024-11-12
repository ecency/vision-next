import { createPortal } from "react-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { renderPostBody } from "@ecency/render-helper";
import { IdentifiableEntry } from "../deck-threads-manager";
import { useRenderWaveBody } from "@/features/waves";
import { renderLiketu } from "../helpers";
import { useGlobalStore } from "@/core/global-store";
import { classNameObject } from "@ui/util";
import Image from "next/image";

interface Props {
  entry: IdentifiableEntry;
  renderInitiated: boolean;
  setRenderInitiated: (v: boolean) => void;
  onResize: () => void;
  height: number | undefined;
}

export const DeckThreadItemBody = ({
  renderInitiated,
  setRenderInitiated,
  entry,
  onResize,
  height
}: Props) => {
  const renderAreaRef = useRef<HTMLDivElement | null>(null);
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  const [currentViewingImage, setCurrentViewingImage] = useState<string | null>(null);
  const [currentViewingImageRect, setCurrentViewingImageRect] = useState<DOMRect | null>(null);
  const [isCurrentViewingImageShowed, setIsCurrentViewingImageShowed] = useState(false);

  const renderBody = useRenderWaveBody(renderAreaRef, entry, {
    setRenderInitiated,
    setCurrentViewingImage,
    setCurrentViewingImageRect
  });

  const renderContentBody = useCallback(() => {
    if (entry.parent_author === "liketu.moments") {
      return renderLiketu(entry);
    }

    return renderPostBody(entry, true, canUseWebp);
  }, [entry, canUseWebp]);

  useEffect(() => {
    if (currentViewingImage) {
      setTimeout(() => {
        setIsCurrentViewingImageShowed(true);
      }, 1);
    }
  }, [currentViewingImage]);

  useEffect(() => {
    onResize();
    if (!renderInitiated) {
      renderBody();
    }
  }, [height, entry, renderBody, renderInitiated]);

  return (
    <div className="thread-item-body">
      <div
        ref={renderAreaRef}
        className="thread-render"
        dangerouslySetInnerHTML={{ __html: renderContentBody() }}
      />
      {currentViewingImage &&
        createPortal(
          <div
            className={classNameObject({
              "deck-full-image-view": true,
              show: isCurrentViewingImageShowed
            })}
            onClick={(e) => {
              e.stopPropagation();

              setIsCurrentViewingImageShowed(false);
              setTimeout(() => {
                setCurrentViewingImageRect(null);
                setCurrentViewingImage(null);
              }, 400);
            }}
          >
            <Image
              width={1000}
              height={1000}
              src={currentViewingImage}
              alt=""
              style={{
                transform: `translate(${currentViewingImageRect?.left}px, ${currentViewingImageRect?.top}px)`,
                width: currentViewingImageRect?.width,
                height: currentViewingImageRect?.height
              }}
            />
          </div>,
          document.querySelector("#deck-media-view-container")!!
        )}
    </div>
  );
};
