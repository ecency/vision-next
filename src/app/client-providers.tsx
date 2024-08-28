"use client";

import { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { UIManager } from "@ui/core";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChatProvider } from "@/app/chat-provider";
import { ClientInit } from "@/app/client-init";
import { getQueryClient } from "@/core/react-query";
import { UserActivityRecorder } from "@/features/user-activity";
import { Tracker } from "@/features/monitoring";
import { Announcements } from "@/features/announcement";
import { FloatingFAQ } from "@/features/faq";
import { EcencyConfigManager } from "@/config";

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
        <ChatProvider>{props.children}</ChatProvider>
        <Announcements />
        <FloatingFAQ />
      </UIManager>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
