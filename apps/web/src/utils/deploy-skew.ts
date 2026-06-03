// Pure, framework-free matchers for deploy/version-skew errors — a client tab
// running a build that no longer matches what the server serves. Kept React-free
// so both the client Sentry config (sentry.client.config.ts) and the runtime
// recovery component (features/pwa-install/service-worker-recovery.tsx) can share
// them without the Sentry config pulling React into its early-loaded module graph.

// Message patterns for a failed chunk / dynamic import — a stale cache or a
// just-replaced build handing the client a chunk that no longer exists.
export function isChunkLoadError(message?: string | null): boolean {
  if (!message) {
    return false;
  }
  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  );
}

// The webpack runtime was handed an undefined module factory: a chunk loaded but
// references a module id the running runtime doesn't have — a build/version
// mismatch after a deploy ("Cannot read properties of undefined (reading 'call')"
// thrown from webpack-*.js, or the Safari equivalent). Require the webpack
// runtime frame so this never fires on unrelated ".call of undefined" app bugs.
function isWebpackFactoryError(error: { message?: string; stack?: string }): boolean {
  const stack = error.stack ?? "";
  const fromWebpackRuntime =
    /webpack-[0-9a-f]+\.js/i.test(stack) || /webpack-internal/i.test(stack);
  if (!fromWebpackRuntime) {
    return false;
  }
  const message = error.message ?? "";
  return (
    /Cannot read propert(?:y|ies) of undefined \(reading 'call'\)/i.test(message) || // Chrome
    /undefined is not an object \(evaluating '[^']*\.call'\)/i.test(message) || // Safari
    /can't access property ['"]?call\b/i.test(message) || // Firefox (\b so it can't match "callback")
    /'call' of undefined/i.test(message)
  );
}

// True when the error indicates the client is running a build that no longer
// matches what the server serves (chunk-load failures + webpack factory
// mismatches). The cure is to reload onto the current build.
export function isDeploySkewError(error: unknown): boolean {
  if (typeof error === "string") {
    return isChunkLoadError(error);
  }
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as { message?: string; stack?: string };
  return isChunkLoadError(e.message) || isWebpackFactoryError(e);
}
