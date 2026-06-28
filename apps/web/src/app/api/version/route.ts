// Build identifier for the currently-deployed server. The client-side deploy-skew
// heartbeat (features/pwa-install/service-worker-recovery.tsx) polls this on tab
// refocus and compares it against the build the tab is running (also SENTRY_RELEASE,
// inlined into the client bundle at build time). A mismatch means the tab is stale
// and gets reloaded onto the current build.
//
// SENTRY_RELEASE is the deploying commit SHA (set in CI, inlined via next.config.js
// `env`); null in local dev, where skew protection is inactive. Served `no-store`
// + `force-dynamic` so neither the CDN nor a stale client can serve an old build id.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { buildId: process.env.SENTRY_RELEASE ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
