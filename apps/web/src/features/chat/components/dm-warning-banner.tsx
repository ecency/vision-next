"use client";

import { useState } from "react";
import i18next from "i18next";

interface DmWarningBannerProps {
  onDismiss: () => void;
  settingsHref?: string;
}

export function DmWarningBanner({ onDismiss, settingsHref }: DmWarningBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mx-4 mt-3 flex items-start gap-3 rounded border border-yellow-500 bg-yellow-50 p-3 dark:border-yellow-600 dark:bg-yellow-900/20">
      <div className="flex-shrink-0 text-lg leading-none" aria-hidden="true">
        ⚠️
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-200">
          {i18next.t("chat.dm-warning-title")}
        </div>
        <div className="text-xs text-yellow-700 dark:text-yellow-300">
          {i18next.t("chat.dm-warning-body")}
          {settingsHref && (
            <>
              {" "}
              <a
                href={settingsHref}
                className="underline underline-offset-2 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                {i18next.t("chat.dm-warning-settings")}
              </a>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100"
        aria-label="Dismiss warning"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
