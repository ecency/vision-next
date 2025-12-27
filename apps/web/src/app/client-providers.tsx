"use client";

import "@/polyfills";
import { ClientInit } from "@/app/client-init";
import { EcencyConfigManager } from "@/config";
import { getQueryClient } from "@/core/react-query";
import { Announcements } from "@/features/announcement";
import { Tracker } from "@/features/monitoring";
import { PushNotificationsProvider } from "@/features/push-notifications";
import { UserActivityRecorder } from "@/features/user-activity";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { UIManager } from "@ui/core";
import { PropsWithChildren, useEffect, useState } from "react";
import { ProgressProvider } from "@bprogress/next/app";

/**
 * Defers rendering children until after initial page load for LCP optimization
 */
function DeferredRender({ children }: PropsWithChildren) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Defer non-critical components until after LCP
    const timer = setTimeout(() => setShouldRender(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return shouldRender ? <>{children}</> : null;
}

export function ClientProviders(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ProgressProvider
        height="3px"
        color="#357ce6"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <UIManager>
          <ClientInit />
          {/* Defer non-critical components for LCP optimization */}
          <DeferredRender>
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.userActivityTracking.enabled}
            >
              <UserActivityRecorder />
            </EcencyConfigManager.Conditional>
            <Tracker />
            <Announcements />
          </DeferredRender>
          <PushNotificationsProvider>{props.children}</PushNotificationsProvider>
        </UIManager>
      </ProgressProvider>
      {/* Only include React Query DevTools in development for LCP optimization */}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
