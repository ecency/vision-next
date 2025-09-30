"use client";

import { useMount, useUnmount } from "react-use";

/**
 * A component that manages the HTML element's position style globally.
 * This ensures that multiple instances don't conflict with each other
 * and prevents hydration mismatches by handling DOM manipulation safely.
 */
export function HtmlPositionManager() {
  useMount(() => {
    const htmlElement = document.getElementsByTagName("html")[0];
    if (htmlElement) {
      htmlElement.style.position = "relative";
    }
  });

  useUnmount(() => {
    const htmlElement = document.getElementsByTagName("html")[0];
    if (htmlElement) {
      htmlElement.style.position = "unset";
    }
  });

  return <></>;
}