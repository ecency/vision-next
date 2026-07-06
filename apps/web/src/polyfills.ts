// BigInt support check
// BigInt is required by @ecency/sdk's makeBitMaskFilter function
// Supported in: Chrome 67+, Firefox 68+, Safari 14+, Edge 79+
// For older browsers, components using hive-tx utils should wrap calls in try-catch
// and provide fallback behavior (see curation-trail.tsx for example)
if (typeof BigInt === "undefined") {
  console.warn(
    "BigInt is not supported in this browser. Some features may not work correctly. " +
      "Please upgrade to a modern browser for the best experience."
  );
}

// SVGAnimatedString fallback
// Firefox with svg.disabled=true removes all SVG DOM interfaces. @bprogress/core
// checks `prop instanceof SVGAnimatedString` (to unwrap SVG anchor hrefs) without
// guarding the global, throwing ReferenceError on every DOM mutation in such
// browsers. With SVG disabled no property can be an SVGAnimatedString, so a stub
// that makes the instanceof check return false restores the intended behavior.
if (typeof window !== "undefined" && typeof window.SVGAnimatedString === "undefined") {
  (window as any).SVGAnimatedString = class SVGAnimatedString {};
}
