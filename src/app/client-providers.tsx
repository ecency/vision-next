"use client";

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
import { ConditionalChatProvider } from "@/app/conditional-chat-provider";

export function ClientProviders(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <UIManager>
        <ClientInit />
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
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
