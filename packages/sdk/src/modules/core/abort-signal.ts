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
    const reason = signal.aborted ? signal.reason : timeoutSignal.reason;
    ac.abort(reason);
    signal.removeEventListener("abort", onAbort);
    timeoutSignal.removeEventListener("abort", onAbort);
  };
  if (signal.aborted) {
    ac.abort(signal.reason);
  } else if (timeoutSignal.aborted) {
    ac.abort(timeoutSignal.reason);
  } else {
    signal.addEventListener("abort", onAbort, { once: true });
    timeoutSignal.addEventListener("abort", onAbort, { once: true });
  }
  return ac.signal;
}
