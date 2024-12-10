import { PropsWithChildren } from "react";
import { ClientProviders } from "@/app/client-providers";
import PlausibleProvider from "next-plausible";
import { EcencyConfigManager } from "@/config";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <PlausibleProvider
      domain={EcencyConfigManager.getConfigValue(
        (config) => config.visionFeatures.analytics.plausible.domain
      )}
      customDomain={EcencyConfigManager.getConfigValue(
        (config) => config.visionFeatures.analytics.plausible.customDomain
      )}
      selfHosted={true}
    >
      <ClientProviders>{children}</ClientProviders>
    </PlausibleProvider>
  );
}
