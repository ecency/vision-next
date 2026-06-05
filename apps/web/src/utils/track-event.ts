type EventProps = Record<string, string | number | boolean>;

type PlausibleFn = {
  (event: string, options?: { props?: EventProps }): void;
  q?: unknown[];
};

/**
 * Fire a Plausible custom event. No-op during SSR. The root layout loads the
 * Plausible script deferred; the queue stub (Plausible's official snippet) keeps
 * events fired before the script finishes loading from being dropped.
 */
export function trackEvent(event: string, props?: EventProps): void {
  if (typeof window === "undefined") {
    return;
  }

  const w = window as Window & { plausible?: PlausibleFn };
  let fn = w.plausible;
  if (!fn) {
    const stub: PlausibleFn = (...args: unknown[]) => {
      (stub.q ??= []).push(args);
    };
    w.plausible = stub;
    fn = stub;
  }

  fn(event, props ? { props } : undefined);
}
