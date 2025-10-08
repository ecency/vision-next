import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { IdentifiableEntry } from "../deck-threads-manager";
import { classNameObject } from "@ui/util";
import Image from "next/image";
import { PostContentRenderer } from "@/features/shared";

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
  const [currentViewingImage, setCurrentViewingImage] = useState<string | null>(null);
  const [currentViewingImageRect, setCurrentViewingImageRect] = useState<DOMRect | null>(null);
  const [isCurrentViewingImageShowed, setIsCurrentViewingImageShowed] = useState(false);
  const portalContainer =
    typeof document !== "undefined"
      ? document.querySelector("#deck-media-view-container") || document.body
      : null;

  useEffect(() => {
    if (currentViewingImage) {
      setTimeout(() => {
        setIsCurrentViewingImageShowed(true);
      }, 1);
    }
  }, [currentViewingImage]);

  return (
    <div className="thread-item-body">
      <PostContentRenderer value={entry.body} />
      {currentViewingImage &&
        portalContainer &&
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
          portalContainer
        )}
    </div>
  );
};
