"use client";

import { BannerLayout } from "@/features/banners/banner-layout";
import { Button } from "@ui/button";
import { UilDownloadAlt, UilMultiply } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isIosSafari, usePwaInstall } from "@/features/pwa-install";

const DISMISSED_KEY = "pwa-install-dismissed-at";
// Re-show the banner 14 days after a user dismisses it, so they get another
// chance without being nagged every visit.
const REDISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < REDISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

// Ecency has dedicated native mobile apps, so the PWA install prompt is
// intentionally scoped to the /mobile landing page where users are already
// looking at install options, instead of nagging visitors across the whole site.
const ALLOWED_PATH = "/mobile";

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { canInstall, installed, install } = usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);

  useEffect(() => {
    if (pathname !== ALLOWED_PATH) return;
    // Check localStorage dismissal state once on mount / when the path
    // becomes /mobile. Effects are safe here because localStorage is client-only.
    setCooldownActive(wasRecentlyDismissed());
    // Show the iOS Share-sheet hint only on real iOS Safari, where the
    // "Share → Add to Home Screen" instruction is actually applicable.
    if (isIosSafari()) setShowIosHint(true);
  }, [pathname]);

  const handleInstall = useCallback(async () => {
    const outcome = await install();
    if (outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch {
        // localStorage unavailable — nothing to persist, banner will reappear next visit.
      }
      setCooldownActive(true);
    }
  }, [install]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable — dismissal is session-only.
    }
  }, []);

  if (pathname !== ALLOWED_PATH) return null;
  if (installed || dismissed || cooldownActive) return null;
  if (!canInstall && !showIosHint) return null;

  return (
    <BannerLayout>
      <div className="flex items-start gap-3">
        <UilDownloadAlt className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-bold">{i18next.t("banners.install-title")}</div>
          <div className="text-sm opacity-75">
            {showIosHint && !canInstall
              ? i18next.t("banners.install-ios-hint")
              : i18next.t("banners.install-description")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canInstall && (
            <Button size="sm" appearance="white" onClick={handleInstall}>
              {i18next.t("banners.install-cta")}
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            appearance="white-link"
            icon={<UilMultiply className="w-4 h-4" />}
          />
        </div>
      </div>
    </BannerLayout>
  );
}
