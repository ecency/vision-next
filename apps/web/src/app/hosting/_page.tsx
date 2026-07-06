"use client";

import { HostingSignup } from "@/features/hosting-signup";
import { hostingApi } from "@/features/hosting-signup/hosting-api";
import i18next from "i18next";

export function HostingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {hostingApi.isConfigured() ? (
        <HostingSignup />
      ) : (
        <div className="max-w-lg mx-auto text-center opacity-75 py-12">
          {i18next.t("hosting.coming-soon")}
        </div>
      )}
    </div>
  );
}
