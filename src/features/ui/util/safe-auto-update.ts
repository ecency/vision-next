import { autoUpdate, type AutoUpdateOptions, type FloatingElement, type ReferenceElement } from "@floating-ui/dom";

export function safeAutoUpdate(
  reference: ReferenceElement | null,
  floating: FloatingElement | null,
  update: () => void,
  options?: AutoUpdateOptions
) {
  if (!reference || !floating) {
    return () => {};
  }
  const cleanup = autoUpdate(reference, floating, update, options);

  const observer = new MutationObserver(() => {
    if (!reference.isConnected || !floating.isConnected) {
      cleanup();
      observer.disconnect();
    }
  });

  observer.observe(floating.ownerDocument ?? document, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    cleanup();
  };
}
