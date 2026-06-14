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

function removeEarlyListeners() {
  if (!isBrowser) return;
  window.removeEventListener("error", earlyErrorHandler);
  window.removeEventListener("unhandledrejection", earlyRejectionHandler);
}

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
let initFailures = 0;
const MAX_INIT_FAILURES = 3;
// Hard cap on the pre-init buffer so a persistently-failing load can never grow
// it without bound (drops the oldest entries first).
const MAX_QUEUE = 100;

// Reset the load/init state so a later call can retry (CDN blip, chunk fetch
// error, or init throw). After MAX_INIT_FAILURES, give up permanently and clear
// the buffers so they can't grow forever.
function onInitFailure(e?: unknown) {
  initFailures += 1;
  initPromise = null;
  loadPromise = null;
  mod = null;
  if (e) console.warn("Sentry init failed:", e);
  if (initFailures >= MAX_INIT_FAILURES) {
    // Give up permanently: clear the buffers AND detach the window listeners,
    // otherwise earlyErrors would keep growing on every error event for the
    // page lifetime (ensureInit no longer drains it once we have given up).
    removeEarlyListeners();
    queued.length = 0;
    earlyErrors.length = 0;
    console.warn("Sentry disabled after repeated load/init failures.");
  }
}

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
  if (initFailures >= MAX_INIT_FAILURES) return Promise.resolve();
  if (initPromise) return initPromise;
  const opts = options;
  initPromise = loadSentry().then((m) => {
    if (!m) {
      onInitFailure();
      return;
    }
    try {
      m.init(opts);
      m.setTag("source", "client");
      removeEarlyListeners();
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
      // init threw: reset so a later capture can retry instead of wedging.
      onInitFailure(e);
    }
  });
  return initPromise;
}

// forceInit: telemetry calls (captures) trigger the load before the idle gate so
// a genuine error doesn't wait out the timeout. Pure context setters
// (setUser/setTag) only BUFFER — they do NOT force the load — so a returning
// logged-in user whose ClientInit calls setUser on mount does not eagerly fetch
// the SDK; the buffered context is replayed when the idle gate (or a real
// capture) initializes it. This preserves the lazy-load win for logged-in users.
function call(method: string, args: unknown[], forceInit: boolean) {
  if (initialized && mod) {
    try {
      (mod as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args);
    } catch {
      /* ignore */
    }
    return;
  }
  if (queued.length >= MAX_QUEUE) queued.shift();
  queued.push({ method, args });
  if (forceInit) void ensureInit();
}

/**
 * Drop-in replacement for `import * as Sentry from "@sentry/nextjs"` on the
 * CLIENT. Methods buffer-then-replay until the SDK is initialized.
 */
export const sentry = {
  // Captures force the load (real telemetry).
  captureException: (...args: Parameters<SentryModule["captureException"]>) =>
    call("captureException", args, true),
  captureMessage: (...args: Parameters<SentryModule["captureMessage"]>) =>
    call("captureMessage", args, true),
  captureFeedback: (...args: Parameters<SentryModule["captureFeedback"]>) =>
    call("captureFeedback", args, true),
  // Context-only: buffer but do NOT force the load (see call() note).
  setUser: (...args: Parameters<SentryModule["setUser"]>) => call("setUser", args, false),
  setTag: (...args: Parameters<SentryModule["setTag"]>) => call("setTag", args, false),
  // Sentry's withScope is overloaded ((scope, cb) | (cb)); the app only uses the
  // single-callback form, so type it explicitly to keep the scope param typed.
  // The callback captures, so it forces the load like other telemetry.
  withScope: (callback: (scope: SentryNS.Scope) => void) => call("withScope", [callback], true),
  // Gate on `initialized` (not `mod`): if init threw, `mod` may be set on an
  // uninitialized client. Returns true when nothing is loaded (nothing to flush).
  flush: async (...args: Parameters<SentryModule["flush"]>) => {
    if (initialized && mod) return mod.flush(...args);
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
  if (!isBrowser) return;

  // Buffer errors that occur in the brief window before the SDK initializes,
  // in every environment (replayed once init completes).
  window.addEventListener("error", earlyErrorHandler);
  window.addEventListener("unhandledrejection", earlyRejectionHandler);

  if (process.env.NODE_ENV === "production") {
    // Defer init to idle / first interaction so the SDK bytes stay off the
    // critical path.
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
