import { PropsWithChildren } from "react";
import { PushNotificationsProvider } from "@/features/push-notifications";
import { ClientProviders } from "@/app/client-providers";
import { BugsnagErrorBoundary } from "@/features/bugsnag";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <BugsnagErrorBoundary>
      <ClientProviders>
        <PushNotificationsProvider>{children}</PushNotificationsProvider>
      </ClientProviders>
    </BugsnagErrorBoundary>
  );
}
