"use client";

import { ChatProvider } from "@/app/chat-provider";
import { ClientInit } from "@/app/client-init";
import { EcencyConfigManager } from "@/config";
import { getQueryClient } from "@/core/react-query";
import { Announcements } from "@/features/announcement";
import { EcencyCenter } from "@/features/ecency-center";
import { Tracker } from "@/features/monitoring";
import { PushNotificationsProvider } from "@/features/push-notifications";
import { UserActivityRecorder } from "@/features/user-activity";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { UIManager } from "@ui/core";
import { PropsWithChildren } from "react";

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
          <ChatProvider>
            {props.children}
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.center.enabled}
            >
              <EcencyCenter />
            </EcencyConfigManager.Conditional>
          </ChatProvider>
        </PushNotificationsProvider>
        <Announcements />
      </UIManager>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
