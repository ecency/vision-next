import { WavesPage } from "@/app/waves/_page";
import { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { EcencyConfigManager } from "@/config";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/features/shared";

export const metadata: Metadata = {
  title: "Waves | Ecency",
  description: "Micro-blogging in decentralized system of Web 3.0"
};

export default function WavesServerPage() {
  const isWavesEnabled = EcencyConfigManager.useConfig(
    ({ visionFeatures }) => visionFeatures.waves.enabled
  );

  if (!isWavesEnabled) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ScrollToTop />
      <WavesPage />
    </HydrationBoundary>
  );
}
