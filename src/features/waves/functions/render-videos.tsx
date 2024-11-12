import React, { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";

export function renderVideos(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLImageElement>(".markdown-video-link")
    .forEach((element) => {
      let embedSrc = element.dataset.embedSrc;
      embedSrc = embedSrc?.replaceAll("autoplay=1", "");

      if (embedSrc) {
        hydrateRoot(
          element,
          <iframe
            className="youtube-shorts-iframe"
            width="100%"
            height="200"
            src={`${embedSrc}`}
            title="Video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={true}
          />
        );
      }
    });
}
