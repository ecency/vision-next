"use client";

import React, { RefObject, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

export function ThreeSpeakVideoRenderer({
  embedSrc,
  container,
}: {
  embedSrc: string;
  container: HTMLElement;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (show) {
      const thumb = container.querySelector(".video-thumbnail");
      const playBtn = container.querySelector(".markdown-video-play");

      if (thumb) (thumb as HTMLElement).style.display = "none";
      if (playBtn) (playBtn as HTMLElement).style.display = "none";
    }
  }, [show]);

  return show ? (
      <iframe
          className="speak-iframe"
          src={embedSrc}
          title="3Speak video"
          frameBorder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
      />
  ) : null;
}

export function ThreeSpeakVideoExtension({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const elements = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        ".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)"
      ) ?? []
    );
    elements.forEach((element) => {
      try {
        // Verify element is still connected to the DOM before manipulation
        if (!element.isConnected || !element.parentNode) {
          console.warn("3Speak video element is not connected to DOM, skipping");
          return;
        }

        const container = document.createElement("div");

        container.classList.add("ecency-renderer-speak-extension-frame");
        element.classList.add("ecency-renderer-speak-extension");

        // Use createRoot instead of hydrateRoot (no server-rendered content to hydrate)
        const root = createRoot(container);
        root.render(
          <ThreeSpeakVideoRenderer
            embedSrc={element.dataset.embedSrc ?? ""}
            container={element}
          />
        );

        // Final safety check before appending
        if (element.isConnected && element.parentNode) {
          element.appendChild(container);
        }
      } catch (error) {
        console.warn("Error enhancing 3Speak video element:", error);
      }
    });
  }, []);

  return <></>;
}
