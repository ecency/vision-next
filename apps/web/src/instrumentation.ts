import * as Sentry from "@sentry/nextjs";

export async function register() {
  Object.defineProperty(global, "_bitcore", {
    get() {
      return undefined;
    },
    set() {}
  });

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    const { initEventLoopMonitor } = await import("./event-loop-monitor");
    initEventLoopMonitor();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
