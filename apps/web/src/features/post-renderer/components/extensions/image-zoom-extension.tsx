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
    let isMounted = true; // Track mount state to prevent post-unmount zoom attachment

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

    // Apply zoom after modifications with final safety check
    try {
      // Filter elements one more time to ensure they're still connected before passing to medium-zoom
      // This prevents "Cannot read property 'parentNode' of null" errors during hydration
      const zoomableImages = Array.from(
        containerRef.current?.querySelectorAll<HTMLImageElement>(
          ".markdown-view:not(.markdown-view-pure) img"
        ) ?? []
      ).filter((img) => {
        try {
          return img.isConnected && img.parentNode !== null;
        } catch {
          return false;
        }
      });

      if (zoomableImages.length > 0) {
        // Wait for all images to load before initializing zoom to ensure correct positioning
        // This fixes the issue where images appear at the bottom of the screen on first click
        const imageLoadPromises = zoomableImages.map((img) => {
          return new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              // Image already loaded
              resolve();
            } else {
              // Wait for image to load
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });

              // Fallback timeout in case load event never fires
              setTimeout(() => resolve(), 3000);
            }
          });
        });

        Promise.all(imageLoadPromises).then(() => {
          // Bail if component unmounted while waiting for images
          if (!isMounted) {
            return;
          }

          // Double-check images are still in DOM after loading
          const connectedImages = zoomableImages.filter((img) => {
            try {
              return img.isConnected && img.parentNode !== null;
            } catch {
              return false;
            }
          });

          if (connectedImages.length > 0) {
            // Small delay to ensure layout is stable after image load
            requestAnimationFrame(() => {
              // Final check before creating zoom instance
              if (!isMounted) {
                return;
              }

              zoomRef.current = mediumZoom(connectedImages, {
                background: "#131111",
                margin: 24, // Add margin for better centering
              });
            });
          }
        }).catch((error) => {
          console.warn("Failed to wait for images to load:", error);
        });
      }
    } catch (error) {
      // Gracefully handle any medium-zoom initialization errors
      console.warn("Failed to initialize medium-zoom:", error);
    }

    return () => {
      isMounted = false; // Mark as unmounted to prevent async operations
      zoomRef.current?.detach();
    };
  }, [containerRef]);

  return <></>;
}
