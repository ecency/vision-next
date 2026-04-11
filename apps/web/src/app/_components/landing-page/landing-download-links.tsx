"use client";

import Link from "next/link";
import i18next from "i18next";
import { MouseEvent, useCallback } from "react";
import { useGlobalStore } from "@/core/global-store";
import { usePwaInstall } from "@/features/pwa-install";

interface Props {
  iosIcon: string;
  iosIconWhite: string;
  androidIcon: string;
  androidIconWhite: string;
}

export function LandingDownloadLinks({
  iosIcon,
  iosIconWhite,
  androidIcon,
  androidIconWhite
}: Props) {
  const theme = useGlobalStore((s) => s.theme);
  const { canInstall, installed, install } = usePwaInstall();

  const handlePwaClick = useCallback(
    async (e: MouseEvent<HTMLAnchorElement>) => {
      // If the browser gave us a deferred install prompt, use it and skip the
      // /mobile fallback navigation. Otherwise let the <Link> navigate to
      // /mobile so the user still gets a way to install (iOS hint, app links).
      if (!canInstall) return;
      e.preventDefault();
      await install();
    },
    [canInstall, install]
  );

  return (
    <>
      <Link href="https://ios.ecency.com/" target="_blank" rel="noopener noreferrer">
        <img
          src={theme === "day" ? iosIcon : iosIconWhite}
          alt={i18next.t("landing-page.download-for-ios")}
        />
        {i18next.t("landing-page.download-for-ios")}
      </Link>
      <Link href="https://android.ecency.com/" target="_blank" rel="noopener noreferrer">
        <img
          src={theme === "day" ? androidIcon : androidIconWhite}
          alt={i18next.t("landing-page.download-for-android")}
        />
        {i18next.t("landing-page.download-for-android")}
      </Link>
      {!installed && (
        <Link href="/mobile" onClick={handlePwaClick}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <polyline points="9 9 12 12 15 9" />
            <line x1="12" y1="6" x2="12" y2="12" />
          </svg>
          {i18next.t("landing-page.install-web-app")}
        </Link>
      )}
    </>
  );
}
