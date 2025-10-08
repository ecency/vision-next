import { PropsWithChildren } from "react";
import { ClientProviders } from "@/app/client-providers";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ClientProviders>{children}</ClientProviders>
  );
}
