"use client";

import { NoLocalStorageBanner } from "@/features/banners/no-local-storage-banner";
import { useMemo } from "react";

export function BannerManager() {
  const hasLocalStorage = useMemo(() => "localStorage" in window, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999]">
      {!hasLocalStorage && <NoLocalStorageBanner />}
    </div>
  );
}
