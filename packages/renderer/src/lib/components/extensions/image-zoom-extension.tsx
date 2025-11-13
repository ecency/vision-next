"use client";

import mediumZoom, { Zoom } from "medium-zoom";
import React, { RefObject, useEffect, useRef } from "react";

export function ImageZoomExtension({
 containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const zoomRef = useRef<Zoom>(undefined);

  useEffect(() => {
    const elements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        ) ?? []
    ).filter((x) => {
        try {
            // Verify element is still connected to the DOM
            if (!x.isConnected) {
                return false;
            }

            // Safe parentNode access with null checking for iOS Safari
            const parentNode = x.parentNode;
            if (!parentNode) {
                return false;
            }

            return (
                parentNode.nodeName !== "A" &&
                !x.classList.contains("medium-zoom-image") &&
                !x.closest(".markdown-image-container")
            );
        } catch (error) {
            // Handle iOS Safari security errors or other DOM access issues
            console.warn("Error accessing image element properties:", error);
            return false;
        }
    });

    elements.forEach((el) => {
      try {
        // Re-verify element is still connected before manipulation
        if (!el.isConnected) {
            console.warn("Image element is no longer connected to DOM, skipping");
            return;
        }

        // Verify parentElement exists before attempting manipulation
        const parentElement = el.parentElement;
        if (!parentElement) {
            console.warn("Image element has no parent, skipping");
            return;
        }

        const container = document.createElement("div");
        container.classList.add("markdown-image-container");

        const clonedImage = el.cloneNode(true) as HTMLElement;

        // Caption logic
        const title = el.getAttribute("title")?.trim();
        const dataCaption = el.getAttribute("data-caption")?.trim();
        const alt = el.getAttribute("alt")?.trim();

        const isAltFilename = alt
            ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(alt)
            : false;

        const captionText = title || dataCaption || (!isAltFilename ? alt : "");

        if (captionText) {
          const caption = document.createElement("div");
          caption.classList.add("markdown-img-caption");
          caption.innerText = captionText;
          container.appendChild(clonedImage);
          container.appendChild(caption);
        } else {
          container.appendChild(clonedImage);
        }

        // Final check before replacing - ensure element is still in DOM
        if (el.isConnected && el.parentElement) {
            el.parentElement.replaceChild(container, el);
        }
      } catch (error) {
        // Handle any errors during DOM manipulation gracefully
        console.warn("Error enhancing image element:", error);
      }
    });

    // Apply zoom after modifications
    zoomRef.current = mediumZoom(
        containerRef.current?.querySelectorAll<HTMLImageElement>(
            ".markdown-view:not(.markdown-view-pure) img"
        ) ?? []
    );

    zoomRef.current?.update({ background: "#131111" });

    return () => {
      zoomRef.current?.detach();
    };
  }, []);

  return <></>;
}
