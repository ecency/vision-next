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
  return autoUpdate(reference, floating, update, options);
}
