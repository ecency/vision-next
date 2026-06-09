/**
 * Picture-awareness for the medium-zoom enhancers, shared by both
 * imageZoomEnhancer.ts and image-zoom-extension.tsx so the logic can't drift.
 *
 * When a markdown <img> is wrapped in a <picture> (responsive content
 * negotiation — render-helper emits avif/webp <source>s + a format=match <img>),
 * the enhancer must wrap/replace the whole <picture>, keeping the <img> a DIRECT
 * child of it. If the <img> is reparented into a <div> instead, per the HTML
 * spec the <source> elements are ignored and the browser loads the un-negotiated
 * format=match URL — silently defeating the optimization.
 */

/** The element to wrap/replace for zoom: the enclosing <picture>, else the <img>. */
export function zoomReplaceTarget(img: HTMLElement): HTMLElement {
  const parent = img.parentElement;
  return parent && parent.nodeName === "PICTURE" ? parent : img;
}

/**
 * The node to treat as the image's "parent" when filtering (linked-image and
 * already-wrapped checks): looks through a <picture> to its parent so a
 * <a><picture><img></picture></a> is still recognized as a linked image.
 */
export function zoomEffectiveParent(node: Node): Node | null {
  return node.nodeName === "PICTURE" ? node.parentNode : node;
}
