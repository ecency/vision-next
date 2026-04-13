// BigInt support check
// BigInt is required by @ecency/hive-tx's makeBitMaskFilter function
// Supported in: Chrome 67+, Firefox 68+, Safari 14+, Edge 79+
// For older browsers, components using hive-tx utils should wrap calls in try-catch
// and provide fallback behavior (see curation-trail.tsx for example)
if (typeof BigInt === "undefined") {
  console.warn(
    "BigInt is not supported in this browser. Some features may not work correctly. " +
      "Please upgrade to a modern browser for the best experience."
  );
}
