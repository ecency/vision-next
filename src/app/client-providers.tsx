"use client";

import "@/polyfills";
import { ClientInit } from "@/app/client-init";
import { EcencyConfigManager } from "@/config";
import { getQueryClient } from "@/core/react-query";
import { Announcements } from "@/features/announcement";
import { Tracker } from "@/features/monitoring";
import { PushNotificationsProvider } from "@/features/push-notifications";
import { UserActivityRecorder } from "@/features/user-activity";
import { ChunkErrorHandler, ErrorBoundary, ChunkErrorLogger } from "@/features/shared/chunk-error-recovery";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { UIManager } from "@ui/core";
import { PropsWithChildren } from "react";
import { ConditionalChatProvider } from "@/app/conditional-chat-provider";
import { ProgressProvider } from "@bprogress/next/app";

export function ClientProviders(props: PropsWithChildren) {
  return (
    <ChunkErrorHandler>
      <ErrorBoundary>
        <QueryClientProvider client={getQueryClient()}>
          <ProgressProvider
            height="3px"
            color="#357ce6"
            options={{ showSpinner: false }}
            shallowRouting
          >
            <UIManager>
              <ClientInit />
              <ChunkErrorLogger />
              <EcencyConfigManager.Conditional
                condition={({ visionFeatures }) => visionFeatures.userActivityTracking.enabled}
              >
                <UserActivityRecorder />
              </EcencyConfigManager.Conditional>
              <Tracker />
              <PushNotificationsProvider>
                <ConditionalChatProvider>
                  {props.children}
                </ConditionalChatProvider>
              </PushNotificationsProvider>
              <Announcements />
            </UIManager>
          </ProgressProvider>
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
      </ErrorBoundary>
    </ChunkErrorHandler>
  );
}
