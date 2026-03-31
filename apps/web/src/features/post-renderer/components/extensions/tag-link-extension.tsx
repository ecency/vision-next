"use client";

import { RefObject, useEffect } from "react";
import "./tag-link-extension.scss";

export function TagLinkExtension({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const elements = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        ".markdown-view:not(.markdown-view-pure) .markdown-tag-link"
      ) ?? []
    );

    elements.forEach((element) => {
      try {
        if (!element.isConnected || !element.parentNode) return;

        const tag = element.innerText.replace(/^\//, "");
        const href = element.getAttribute("href");
        if (!tag || !href) return;

        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener";
        link.classList.add(
          "er-tag",
          "er-tag-link"
        );
        link.textContent = tag;

        if (element.isConnected && element.parentElement) {
          element.parentElement.replaceChild(link, element);
        }
      } catch (error) {
        console.warn("Error enhancing tag link element:", error);
      }
    });
  }, []);

  return null;
}
