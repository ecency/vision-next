"use client";

import React, { RefObject, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type VideoOrientation = "landscape" | "portrait" | "square";

const THREE_SPEAK_EMBED_ORIGIN = "https://play.3speak.tv";

export function ThreeSpeakVideoRenderer({
  embedSrc,
  container,
}: {
  embedSrc: string;
  container: HTMLElement;
}) {
  const [show, setShow] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [orientation, setOrientation] = useState<VideoOrientation>("landscape");

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

  // Listen for 3speak-player-ready to auto-detect video orientation
  useEffect(() => {
    if (!show) return;

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== THREE_SPEAK_EMBED_ORIGIN ||
        event.data?.type !== "3speak-player-ready" ||
        iframeRef.current?.contentWindow !== event.source
      ) {
        return;
      }

      if (event.data.isVertical) {
        setOrientation("portrait");
      } else if (
        event.data.aspectRatio &&
        Math.abs(event.data.aspectRatio - 1) < 0.1
      ) {
        setOrientation("square");
      } else {
        setOrientation("landscape");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [show]);

  // Apply orientation class to the parent container element
  useEffect(() => {
    if (orientation !== "landscape") {
      container.classList.add(`speak-${orientation}`);
    }
    return () => {
      container.classList.remove("speak-portrait", "speak-square");
    };
  }, [orientation, container]);

  return show ? (
    <iframe
      ref={iframeRef}
      className="speak-iframe"
      src={embedSrc}
      title="3Speak video"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
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
