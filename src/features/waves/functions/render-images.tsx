"use client";

import { MutableRefObject } from "react";

export function renderImages(
  renderAreaRef: MutableRefObject<HTMLElement | null>,
  opt: Record<string, any>
) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLImageElement>("img, .markdown-img-link")
    .forEach((element) => {
      const src = element.getAttribute("src");

      if (src) {
        element.addEventListener("click", () => {
          opt.setCurrentViewingImageRect(element.getBoundingClientRect());
          opt.setCurrentViewingImage(src);
        });
      }
    });
}
