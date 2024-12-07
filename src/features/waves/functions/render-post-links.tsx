"use client";

import React, { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";
import { WaveLinkRender } from "@/features/waves";

export function renderPostLinks(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLLinkElement>(".markdown-post-link")
    .forEach((element) => {
      const { author, permlink } = element.dataset;

      if (author && permlink) {
        element.href = `/@${author}/${permlink}`;
        element.target = "_blank";
        hydrateRoot(element, <WaveLinkRender link={`/@${author}/${permlink}`} />);
      }
    });
}
