"use client";

import mediumZoom, { Zoom } from "medium-zoom";
import React, { RefObject, useEffect, useRef } from "react";

export function ImageZoomExtension({
 containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const zoomRef = useRef<Zoom>(undefined);

  useEffect(() => {
    const elements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        ) ?? []
    ).filter(
        (x) =>
            x.parentNode?.nodeName !== "A" &&
            !x.classList.contains("medium-zoom-image") &&
            !x.closest(".markdown-image-container")
    );

    elements.forEach((el) => {
      const container = document.createElement("div");
      container.classList.add("markdown-image-container");

      const clonedImage = el.cloneNode(true) as HTMLElement;

      // Caption logic
      const title = el.getAttribute("title")?.trim();
      const dataCaption = el.getAttribute("data-caption")?.trim();
      const alt = el.getAttribute("alt")?.trim();

      const isAltFilename = alt
          ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(alt)
          : false;

      const captionText = title || dataCaption || (!isAltFilename ? alt : "");

      if (captionText) {
        const caption = document.createElement("div");
        caption.classList.add("markdown-img-caption");
        caption.innerText = captionText;
        container.appendChild(clonedImage);
        container.appendChild(caption);
      } else {
        container.appendChild(clonedImage);
      }

      el.parentElement?.replaceChild(container, el);
    });

    // Apply zoom after modifications
    zoomRef.current = mediumZoom(
        containerRef.current?.querySelectorAll<HTMLImageElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        ) ?? []
    );

    zoomRef.current?.update({ background: "#131111" });

    return () => {
      zoomRef.current?.detach();
    };
  }, []);

  return <></>;
}
