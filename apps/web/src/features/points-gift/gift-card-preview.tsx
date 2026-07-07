"use client";

import { UilGift } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  points: number;
  recipient: string;
  message?: string;
}

/**
 * The live gift-card preview shown at the top of the /gift page: a bordered card that
 * mirrors the chosen amount, recipient and message as they are edited, so the buyer sees
 * exactly what the recipient gets before paying.
 */
export function GiftCardPreview({ points, recipient, message }: Props) {
  const cleanRecipient = recipient.trim().replace(/^@/, "");

  return (
    <div className="rounded-2xl border border-blue-dark-sky/40 bg-gradient-to-br from-blue-dark-sky/10 to-blue-duck-egg dark:from-blue-dark-sky/20 dark:to-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-blue-dark-sky font-semibold">
          <UilGift className="w-6 h-6" />
          {i18next.t("points-gift.card-label")}
        </span>
        <span className="text-xs uppercase tracking-wide opacity-60">
          {i18next.t("points-gift.card-brand")}
        </span>
      </div>

      <div className="mt-6 text-4xl font-bold text-black dark:text-white">
        {points.toLocaleString()} {i18next.t("points-gift.points-unit")}
      </div>

      <div className="mt-2 text-lg">
        {i18next.t("points-gift.preview-for")}{" "}
        <span className="font-semibold text-blue-dark-sky">
          @{cleanRecipient || i18next.t("points-gift.preview-recipient-placeholder")}
        </span>
      </div>

      {message?.trim() && (
        <div className="mt-4 border-t border-blue-dark-sky/20 pt-3 text-sm italic opacity-80 break-words">
          {message.trim()}
        </div>
      )}
    </div>
  );
}
