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
import { PropsWithChildren } from "react";
import { ProgressProvider } from "@bprogress/next/app";

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
          <EcencyConfigManager.Conditional
            condition={({ visionFeatures }) => visionFeatures.userActivityTracking.enabled}
          >
            <UserActivityRecorder />
          </EcencyConfigManager.Conditional>
          <Tracker />
          <PushNotificationsProvider>{props.children}</PushNotificationsProvider>
          <Announcements />
        </UIManager>
      </ProgressProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
