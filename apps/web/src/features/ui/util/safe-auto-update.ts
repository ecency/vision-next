import { autoUpdate, type AutoUpdateOptions, type FloatingElement, type ReferenceElement } from "@floating-ui/dom";

/**
 * Safely wraps floating-ui's autoUpdate to prevent errors when DOM elements are removed.
 * This prevents "Cannot read property 'parentNode' of null" errors in Sentry.
 */
export function safeAutoUpdate(
  reference: ReferenceElement | null,
  floating: FloatingElement | null,
  update: () => void,
  options?: AutoUpdateOptions
) {
  if (!reference || !floating) {
    return () => {};
  }

  // Check if elements are still connected to the DOM before initializing
  const isReferenceConnected = reference instanceof Node ? reference.isConnected : true;
  const isFloatingConnected = floating.isConnected;

  if (!isReferenceConnected || !isFloatingConnected) {
    return () => {};
  }

  let cleanup: (() => void) | null = null;
  let observer: MutationObserver | null = null;

  try {
    // Wrap autoUpdate in try-catch to handle race conditions where elements
    // are removed between our check and when autoUpdate accesses them
    cleanup = autoUpdate(reference, floating, update, options);

    observer = new MutationObserver(() => {
      try {
        if (
          (reference instanceof Node && !reference.isConnected) ||
          !floating.isConnected
        ) {
          cleanup?.();
          observer?.disconnect();
          cleanup = null;
          observer = null;
        }
      } catch (error) {
        // Silently handle errors during cleanup check
        console.debug('safeAutoUpdate: Error during MutationObserver callback', error);
      }
    });

    observer.observe(floating.ownerDocument ?? document, {
      childList: true,
      subtree: true,
    });
  } catch (error) {
    // Handle initialization errors (e.g., elements removed during autoUpdate setup)
    console.debug('safeAutoUpdate: Error during initialization', error);
    observer?.disconnect();
    return () => {};
  }

  return () => {
    try {
      observer?.disconnect();
      cleanup?.();
    } catch (error) {
      // Silently handle cleanup errors
      console.debug('safeAutoUpdate: Error during cleanup', error);
    }
  };
}
