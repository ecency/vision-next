export function withTimeoutSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeoutSignal;

  // AbortSignal.any is available in Chrome 116+, Safari 17.4+, Firefox 124+.
  // Fall back to manual AbortController wiring for older browsers.
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  const ac = new AbortController();
  const onAbort = () => {
    ac.abort();
    signal.removeEventListener("abort", onAbort);
    timeoutSignal.removeEventListener("abort", onAbort);
  };
  if (signal.aborted || timeoutSignal.aborted) {
    ac.abort();
  } else {
    signal.addEventListener("abort", onAbort, { once: true });
    timeoutSignal.addEventListener("abort", onAbort, { once: true });
  }
  return ac.signal;
}
