"use client";

import { useState } from "react";
import i18next from "i18next";
import { UilExclamationTriangle, UilTimes } from "@tooni/iconscout-unicons-react";

interface Props {
  isActiveTab: boolean;
}

export function PublishMultiTabWarning({ isActiveTab }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if this is the active tab or if user dismissed it
  if (isActiveTab || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-16 md:top-24 left-0 right-0 z-40 mx-auto max-w-4xl px-4 animate-slide-down">
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-md shadow-lg flex items-start gap-3">
        <UilExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {i18next.t("publish.multi-tab-warning-title", {
              defaultValue: "This draft is being edited in another tab"
            })}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            {i18next.t("publish.multi-tab-warning-message", {
              defaultValue:
                "Auto-save is disabled in this tab to prevent conflicts. Changes made here will not be saved automatically."
            })}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
          aria-label="Dismiss"
        >
          <UilTimes className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
