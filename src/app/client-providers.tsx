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
import { PushNotificationsProvider } from "@/features/push-notifications";
import { EcencyCenter } from "@/features/ecency-center";

export function ClientProviders(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={makeQueryClient()}>
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
        <FloatingFAQ />
      </UIManager>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
