"use client";

import React, { MutableRefObject } from "react";
import { hydrateRoot } from "react-dom/client";

export function renderExternalLinks(renderAreaRef: MutableRefObject<HTMLElement | null>) {
  return renderAreaRef.current
    ?.querySelectorAll<HTMLLinkElement>(".markdown-external-link")
    .forEach((element) => {
      let href = element.dataset.href ?? null;
      if (!href) {
        href = element.getAttribute("href");
      }

      if (href) {
        element.href = href;
        element.target = "_blank";
      }

      // Process YouTube links dropped from render-helper
      if (href?.startsWith("https://youtube.com") || href?.startsWith("https://www.youtube.com")) {
        const link = new URL(href);
        const code = link.pathname.replaceAll("/shorts/", "");

        hydrateRoot(
          element,
          <iframe
            className="youtube-shorts-iframe"
            width="100%"
            height="600"
            src={`https://www.youtube.com/embed/${code}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen={true}
          />
        );
      }
    });
}
