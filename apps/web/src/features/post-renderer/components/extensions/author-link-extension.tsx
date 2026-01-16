"use client";

import React, { RefObject, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./author-link-extension.scss";

export function AuthorLinkRenderer({ author }: { author: string }) {
  const imageSrc = `https://images.ecency.com/u${author.toLowerCase().replace("@", "")}/avatar/small`;

  return (
      <>
        <img
            src={imageSrc}
            className="ecency-renderer-author-extension-link-image"
            alt={author}
        />
        <div className="ecency-renderer-author-extension-link-content">
        <span className="ecency-renderer-author-extension-link-content-label">
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
  useEffect(() => {
    const elements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) .markdown-author-link",
        ) ?? [],
    );

    elements.forEach((element) => {
      if (element.dataset.enhanced === "true") return;

      const authorHref = element.getAttribute("href");
      if (!authorHref) return;

      const container = document.createElement("a");

      container.setAttribute("href", authorHref);
      container.setAttribute("target", "_blank");
      container.setAttribute("rel", "noopener");

      container.classList.add("ecency-renderer-author-extension");
      container.classList.add("ecency-renderer-author-extension-link");

      const root = createRoot(container);
      root.render(<AuthorLinkRenderer author={authorHref} />);

      element.parentElement?.replaceChild(container, element);
      container.dataset.enhanced = "true";
    });
  }, []);

  return null;
}
