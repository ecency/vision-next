// Lazy Sentry facade.
//
// `@sentry/nextjs` was chunk 223 (~116KB gz) sitting in build-manifest
// rootMainFiles — a static <script> on all 169 routes — because the client
// config AND several always-loaded modules (auth store, global-error, feedback)
// statically `import * as Sentry from "@sentry/nextjs"`. Routing every
// client-side Sentry use through this facade means nothing on the eager graph
// statically imports the SDK, so webpack splits it into an async chunk that is
// only fetched after first interaction / idle (or on first capture). Calls made
// before the SDK resolves are buffered and replayed, so early-error coverage is
// preserved.
//
// Server/edge Sentry (instrumentation.ts, sentry.server/edge.config.ts, API
// routes, RSS) is unaffected and keeps importing @sentry/nextjs directly.
import type * as SentryNS from "@sentry/nextjs";

type SentryModule = typeof import("@sentry/nextjs");
type Options = SentryNS.BrowserOptions;

const isBrowser = typeof window !== "undefined";

let mod: SentryModule | null = null;
let loadPromise: Promise<SentryModule | null> | null = null;
let initialized = false;
let options: Options | null = null;

// Method calls made before the SDK is initialized, replayed on init.
const queued: { method: string; args: unknown[] }[] = [];
// Raw errors/rejections captured by the early listeners before init.
const earlyErrors: unknown[] = [];

const earlyErrorHandler = (e: ErrorEvent) => {
  earlyErrors.push(e.error);
};
const earlyRejectionHandler = (e: PromiseRejectionEvent) => {
  earlyErrors.push(e.reason);
};

function loadSentry(): Promise<SentryModule | null> {
  if (mod) return Promise.resolve(mod);
  if (!loadPromise) {
    loadPromise = import("@sentry/nextjs")
      .then((m) => {
        mod = m;
        return m;
      })
      .catch((e) => {
        console.warn("Sentry load failed, error tracking disabled:", e);
        return null;
      });
  }
  return loadPromise;
}

let initPromise: Promise<void> | null = null;

/**
 * Load + initialize the real SDK (once), then replay anything buffered.
 * Safe to call repeatedly and from a capture before the idle gate fires.
 */
function ensureInit(): Promise<void> {
  if (initialized) return Promise.resolve();
  // Not configured yet (configureLazySentry runs at client entry-eval, before
  // any capture in practice). Return WITHOUT memoizing so the call made right
  // after configure can still initialize — memoizing a no-op here would wedge it.
  if (!options) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = loadSentry().then((m) => {
    if (!m) return;
    try {
      if (options) {
        m.init(options);
        m.setTag("source", "client");
      }
      if (isBrowser) {
        window.removeEventListener("error", earlyErrorHandler);
        window.removeEventListener("unhandledrejection", earlyRejectionHandler);
      }
      initialized = true;
      // Replay buffered method calls in order.
      for (const c of queued.splice(0)) {
        try {
          (m as unknown as Record<string, (...a: unknown[]) => unknown>)[c.method](...c.args);
        } catch {
          /* ignore replay errors */
        }
      }
      // Replay raw early errors.
      for (const err of earlyErrors.splice(0)) {
        try {
          m.captureException(err);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      console.warn("Sentry init failed, error tracking disabled:", e);
    }
  });
  return initPromise;
}

function call(method: string, args: unknown[]) {
  if (initialized && mod) {
    try {
      (mod as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args);
    } catch {
      /* ignore */
    }
    return;
  }
  queued.push({ method, args });
  // First real use triggers the load even before the idle gate fires, so a
  // genuine error does not wait out the full idle timeout.
  void ensureInit();
}

/**
 * Drop-in replacement for `import * as Sentry from "@sentry/nextjs"` on the
 * CLIENT. Methods buffer-then-replay until the SDK is initialized.
 */
export const sentry = {
  captureException: (...args: Parameters<SentryModule["captureException"]>) =>
    call("captureException", args),
  captureMessage: (...args: Parameters<SentryModule["captureMessage"]>) =>
    call("captureMessage", args),
  captureFeedback: (...args: Parameters<SentryModule["captureFeedback"]>) =>
    call("captureFeedback", args),
  setUser: (...args: Parameters<SentryModule["setUser"]>) => call("setUser", args),
  setTag: (...args: Parameters<SentryModule["setTag"]>) => call("setTag", args),
  // Sentry's withScope is overloaded ((scope, cb) | (cb)); the app only uses the
  // single-callback form, so type it explicitly to keep the scope param typed.
  withScope: (callback: (scope: SentryNS.Scope) => void) => call("withScope", [callback]),
  // flush only matters once loaded; before that there is nothing buffered to send.
  flush: async (...args: Parameters<SentryModule["flush"]>) => {
    if (mod) return mod.flush(...args);
    return true;
  }
};

/**
 * Called once from sentry.client.config.ts with the resolved options. Wires the
 * early-error listeners and the idle-deferred init, mirroring the previous
 * inline behavior but with the SDK bytes lazy-loaded.
 */
export function configureLazySentry(opts: Options) {
  options = opts;

  if (isBrowser && process.env.NODE_ENV === "production") {
    window.addEventListener("error", earlyErrorHandler);
    window.addEventListener("unhandledrejection", earlyRejectionHandler);

    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => void })
        .requestIdleCallback(() => void ensureInit(), { timeout: 5000 });
    } else {
      setTimeout(() => void ensureInit(), 3000);
    }
  } else {
    // Dev / non-production: initialize immediately (matches old else branch).
    void ensureInit();
  }
}
