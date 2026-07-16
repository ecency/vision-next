"use client";

import { HostingManage, HostingSignup } from "@/features/hosting-signup";
import { hostingApi } from "@/features/hosting-signup/hosting-api";
import i18next from "i18next";

export function HostingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {hostingApi.isConfigured() ? (
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <HostingManage />
          <HostingSignup />
        </div>
      ) : (
        <div className="max-w-lg mx-auto text-center opacity-75 py-12">
          {i18next.t("hosting.coming-soon")}
        </div>
      )}
    </div>
  );
}
