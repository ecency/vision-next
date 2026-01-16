"use client";

import React, { RefObject, useCallback, useEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { clsx } from "clsx";
import "./youtube-video-extension.scss";
import { getYoutubeEmbedUrl } from "../utils/getYoutubeEmbedUrl";

export function YoutubeVideoRenderer({
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
      className="youtube-shorts-iframe"
      src={embedSrc}
      title="Video player"
      frameBorder="0"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  ) : null;
}

export function YoutubeVideoExtension({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const elements = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        ".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.ecency-renderer-youtube-extension)",
      ) ?? [],
    );
    elements.forEach((element) => {
      const embedSrc =
        element.dataset.embedSrc ||
        getYoutubeEmbedUrl(element.getAttribute("href") ?? "");
      element.dataset.embedSrc = embedSrc;
      const container = document.createElement("div");

      container.classList.add("ecency-renderer-youtube-extension-frame");
      element.classList.add("ecency-renderer-youtube-extension");

      hydrateRoot(
        container,
        <YoutubeVideoRenderer embedSrc={embedSrc} container={element} />,
      );
      element.appendChild(container);
    });
  }, []);

  return <></>;
}
