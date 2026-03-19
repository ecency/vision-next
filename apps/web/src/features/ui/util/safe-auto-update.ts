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
  let disposed = false;

  // Wrap the update callback to check element connectivity before each
  // computePosition call. This closes the race window where scroll/resize
  // events fire after an element is detached but before the MutationObserver
  // callback runs.
  const safeUpdate = () => {
    if (disposed) return;
    try {
      const refConnected = reference instanceof Node ? reference.isConnected : true;
      if (!refConnected || !floating.isConnected) {
        dispose();
        return;
      }
      update();
    } catch {
      // Swallow errors from computePosition on detached elements
    }
  };

  function dispose() {
    if (disposed) return;
    disposed = true;
    try {
      observer?.disconnect();
      cleanup?.();
    } catch {
      // Silently handle cleanup errors
    }
    cleanup = null;
    observer = null;
  }

  try {
    cleanup = autoUpdate(reference, floating, safeUpdate, options);

    observer = new MutationObserver(() => {
      try {
        if (
          (reference instanceof Node && !reference.isConnected) ||
          !floating.isConnected
        ) {
          dispose();
        }
      } catch {
        // Silently handle errors during cleanup check
      }
    });

    observer.observe(floating.ownerDocument ?? document, {
      childList: true,
      subtree: true,
    });
  } catch {
    // Handle initialization errors (e.g., elements removed during autoUpdate setup)
    dispose();
    return dispose;
  }

  return dispose;
}
