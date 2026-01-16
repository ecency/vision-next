const MARKDOWN_SCOPE_SELECTOR = ".markdown-view:not(.markdown-view-pure) a.markdown-post-link";

/**
 * Finds inline post link elements that should be enhanced with interactive previews.
 *
 * Relies on @ecency/render-helper to:
 * - Validate post URLs (Ecency, PeakD, Hive.blog)
 * - Add "markdown-post-link" class
 * - Set "data-is-inline" attribute with sophisticated inline detection
 *
 * This function simply filters to inline links that render-helper already identified.
 *
 * @param container - The HTML element to search within (typically .markdown-view)
 * @returns Array of anchor elements that should be enhanced
 */
export function findPostLinkElements(container: HTMLElement): HTMLAnchorElement[] {
  const anchors = Array.from(
    container.querySelectorAll<HTMLAnchorElement>(MARKDOWN_SCOPE_SELECTOR),
  );

  return anchors.filter((anchor) => {
    // Check cache to avoid re-processing
    if (anchor.dataset.postLinkChecked === "true") {
      return anchor.dataset.postLinkEnhanceable === "true";
    }

    // Mark as checked for caching
    anchor.dataset.postLinkChecked = "true";

    // Only enhance inline links (where display text matches URL structure)
    // render-helper sets this attribute with sophisticated normalization
    const isInline = anchor.dataset.isInline === "true";

    // Cache the result
    anchor.dataset.postLinkEnhanceable = String(isInline);

    return isInline;
  });
}
