"use client";

import React, { RefObject, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./tag-link-extension.scss";

export function TagLinkRenderer({ tag }: { tag: string }) {
  return <span>{tag.replace("/", "")}</span>;
}

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
        // Verify element is still connected to the DOM before manipulation
        if (!element.isConnected || !element.parentNode) {
          console.warn("Tag link element is not connected to DOM, skipping");
          return;
        }

        const container = document.createElement("a");

        container.setAttribute("href", element.getAttribute("href") ?? "");
        container.setAttribute("target", "_blank");
        container.setAttribute("rel", "noopener");

        container.classList.add("ecency-renderer-tag-extension");
        container.classList.add("ecency-renderer-tag-extension-link");

        // Use createRoot instead of hydrateRoot
        const root = createRoot(container);
        root.render(<TagLinkRenderer tag={element.innerText} />);

        // Final safety check before replacing
        if (element.isConnected && element.parentElement) {
          element.parentElement.replaceChild(container, element);
        }
      } catch (error) {
        console.warn("Error enhancing tag link element:", error);
      }
    });
  }, []);

  return null;
}
