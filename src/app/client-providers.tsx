"use client";

import React, { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { UIManager } from "@ui/core";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChatProvider } from "@/app/chat-provider";
import { ClientInit } from "@/app/client-init";
import { makeQueryClient } from "@/core/react-query";
import { UserActivityRecorder } from "@/features/user-activity";
import { Tracker } from "@/features/monitoring";
import { Announcements } from "@/features/announcement";
import { FloatingFAQ } from "@/features/faq";
import { EcencyConfigManager } from "@/config";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import BugsnagPerformance from "@bugsnag/browser-performance";

export function ClientProviders(props: PropsWithChildren) {
  Bugsnag.start({
    apiKey: "53c03fdd42cd699cb95f60abe77a5b19",
    plugins: [new BugsnagPluginReact()]
  });
  BugsnagPerformance.start({ apiKey: "53c03fdd42cd699cb95f60abe77a5b19" });
  const ErrorBoundary = Bugsnag.getPlugin("react").createErrorBoundary(React);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={makeQueryClient()}>
        <UIManager>
          <ClientInit />
          <EcencyConfigManager.Conditional
            condition={({ visionFeatures }) => visionFeatures.userActivityTracking.enabled}
          >
            <UserActivityRecorder />
          </EcencyConfigManager.Conditional>
          <Tracker />
          <ChatProvider>{props.children}</ChatProvider>
          <Announcements />
          <FloatingFAQ />
        </UIManager>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
