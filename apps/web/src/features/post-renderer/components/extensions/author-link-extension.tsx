"use client";

import React, { RefObject, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./author-link-extension.scss";

export function AuthorLinkRenderer({ author }: { author: string }) {
  const imageSrc = `https://images.ecency.com/u${author.toLowerCase().replace("@", "")}/avatar/small`;

  return (
      <>
        <img
            src={imageSrc}
            className="er-author-link-image"
            alt={author}
        />
        <div className="er-author-link-content">
        <span className="er-author-link-label">
          Hive account
        </span>
          <span>{author.toLowerCase().replace("/", "")}</span>
        </div>
      </>
  );
}

export function AuthorLinkExtension({
                                      containerRef,
                                    }: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  useEffect(() => {
    rootsRef.current.forEach(r => r.unmount());
    rootsRef.current = [];

    const elements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-author-link",
        ) ?? [],
    );

    elements.forEach((element) => {
      try {
        if (element.dataset.enhanced === "true") return;

        // Verify element is still connected to the DOM before manipulation
        if (!element.isConnected || !element.parentNode) {
          console.warn("Author link element is not connected to DOM, skipping");
          return;
        }

        const authorHref = element.getAttribute("href");
        if (!authorHref) return;

        const container = document.createElement("a");

        container.setAttribute("href", authorHref);
        container.setAttribute("target", "_blank");
        container.setAttribute("rel", "noopener");

        container.classList.add("er-author");
        container.classList.add("er-author-link");

        const root = createRoot(container);
        rootsRef.current.push(root);
        root.render(<AuthorLinkRenderer author={authorHref} />);

        // Final safety check before replacing
        if (element.isConnected && element.parentElement) {
          element.parentElement.replaceChild(container, element);
          container.dataset.enhanced = "true";
        }
      } catch (error) {
        console.warn("Error enhancing author link element:", error);
      }
    });

    return () => {
      rootsRef.current.forEach(r => r.unmount());
      rootsRef.current = [];
    };
  }, []);

  return null;
}
