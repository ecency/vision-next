import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import BugsnagPerformance from "@bugsnag/browser-performance";
import React, { PropsWithChildren } from "react";

export function BugsnagErrorBoundary(props: PropsWithChildren) {
  if (process.env.NODE_ENV !== "production") {
    return <>{props.children}</>;
  }

  Bugsnag.start({
    apiKey: "53c03fdd42cd699cb95f60abe77a5b19",
    plugins: [new BugsnagPluginReact()]
  });
  BugsnagPerformance.start({ apiKey: "53c03fdd42cd699cb95f60abe77a5b19" });
  const ErrorBoundary = Bugsnag.getPlugin("react")!.createErrorBoundary(React);

  return <ErrorBoundary>{props.children}</ErrorBoundary>;
}
