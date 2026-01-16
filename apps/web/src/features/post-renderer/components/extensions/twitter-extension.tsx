"use client";

import React, { RefObject, useEffect } from "react";
import { createRoot } from "react-dom/client";

export function TwitterExtension({
  containerRef,
  ComponentInstance,
}: {
  containerRef: RefObject<HTMLElement | null>;
  ComponentInstance: React.FC<{ id: string }>;
}) {
  useEffect(() => {
    const elements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-external-link"
        ) ?? []
    );

    elements
        .filter((el) => {
          const href = el.getAttribute("href") || "";
          return href.startsWith("https://x.com") || href.startsWith("https://twitter.com");
        })
        .forEach((element) => {
          try {
            const href = element.getAttribute("href");
            if (!href) return;

            const url = new URL(href);
            const tweetId = url.pathname.split("/").pop();
            if (!tweetId) return;

            const container = document.createElement("div");
            container.classList.add("ecency-renderer-twitter-extension-frame");
            element.classList.add("ecency-renderer-twitter-extension");

            element.innerHTML = "";
            element.appendChild(container);

            const root = createRoot(container);
            root.render(<ComponentInstance id={tweetId} />);
          } catch (e) {
            console.warn("TwitterExtension failed to render tweet:", e);
          }
        });
  }, [containerRef]);

  return null;
}
