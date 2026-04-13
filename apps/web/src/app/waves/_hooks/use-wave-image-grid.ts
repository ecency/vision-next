"use client";

import { RefObject, useEffect } from "react";

/**
 * Groups adjacent .markdown-image-container elements into a .wave-image-grid
 * wrapper for multi-image grid display.
 *
 * After ImageZoomExtension runs, each image is wrapped in a
 * <div class="markdown-image-container"> that lives inside its own <p> tag.
 * This hook finds <p> tags whose only meaningful content is an image container,
 * groups adjacent ones, and wraps them in a grid.
 */
export function useWaveImageGrid(
  containerRef: RefObject<HTMLElement | null>,
  body: string | undefined
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any previously created grids so we operate on the original DOM
    container.querySelectorAll<HTMLElement>(".wave-image-grid").forEach((grid) => {
      while (grid.firstChild) {
        grid.parentNode?.insertBefore(grid.firstChild, grid);
      }
      grid.remove();
    });

    const imageContainers = Array.from(
      container.querySelectorAll<HTMLElement>(".markdown-image-container")
    );
    if (imageContainers.length < 2) return;

    // For each image container, find its "wrapper" — the <p> parent if it has
    // one and the <p> contains only this image, otherwise the container itself.
    const wrappers = imageContainers.map((ic) => {
      const parent = ic.parentElement;
      if (
        parent &&
        parent.tagName === "P" &&
        parent.children.length === 1 &&
        !parent.textContent?.replace(/\s/g, "")
      ) {
        return { wrapper: parent, container: ic };
      }
      return { wrapper: ic, container: ic };
    });

    // Group adjacent wrappers
    const groups: { wrapper: HTMLElement; container: HTMLElement }[][] = [];
    let currentGroup = [wrappers[0]];

    for (let i = 1; i < wrappers.length; i++) {
      const prevWrapper = wrappers[i - 1].wrapper;
      const currWrapper = wrappers[i].wrapper;

      // Walk from prev to curr, skipping whitespace text nodes
      let node: Node | null = prevWrapper.nextSibling;
      while (node && node !== currWrapper) {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
          node = node.nextSibling;
          continue;
        }
        break;
      }

      if (node === currWrapper) {
        currentGroup.push(wrappers[i]);
      } else {
        if (currentGroup.length >= 2) groups.push(currentGroup);
        currentGroup = [wrappers[i]];
      }
    }
    if (currentGroup.length >= 2) groups.push(currentGroup);

    // Wrap each group in a grid div
    for (const group of groups) {
      const grid = document.createElement("div");
      grid.className = "wave-image-grid";
      group[0].wrapper.parentNode?.insertBefore(grid, group[0].wrapper);

      for (const { wrapper, container } of group) {
        // If wrapper is a <p>, remove it and move the image container into the grid
        if (wrapper !== container) {
          grid.appendChild(container);
          wrapper.remove();
        } else {
          grid.appendChild(wrapper);
        }
      }
    }
  }, [body]);
}
