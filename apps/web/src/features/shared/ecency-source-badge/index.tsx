import { appName } from "@/utils";
import clsx from "clsx";
import i18next from "i18next";
import React from "react";

interface Props {
  /**
   * Raw `app` value to inspect — either `json_metadata.app` (a string or a
   * `{ name }` object) or the flat `app` string returned by the search API.
   */
  app: string | { name?: string } | null | undefined;
  /** Rendered size in px (square). Defaults to 14. */
  size?: number;
  className?: string;
}

/**
 * Small Ecency logo shown next to content that was published from an Ecency
 * client ("ecency/x.y-vision" on web, "ecency-mobile" on mobile) so it's clear
 * at a glance which posts, comments and waves were published by/with Ecency.
 * Renders nothing for content from any other client.
 *
 * Deliberately low-emphasis: the bare "e" mark in muted gray, not the full blue
 * gradient disc. The disc read as a status badge and sat right next to the blue
 * Pro checkmark, so the two competed for the same attention — one means "this
 * account pays for Pro", the other only "posted from Ecency", and they should
 * not carry equal weight. Inlined rather than next/image so the glyph inherits
 * currentColor and each surface can retone it via className.
 */
export function EcencySourceBadge({ app, size = 14, className }: Props) {
  // Every Ecency client identifier starts with "ecency" (ecency/x.y-vision,
  // ecency-mobile, ecency.waves), so anchor the match to the start rather than a
  // loose substring that would also catch lookalikes like "notecency/...".
  const isEcency = appName(app).toLowerCase().startsWith("ecency");

  if (!isEcency) {
    return null;
  }

  const label = i18next.t("waves.source-ecency");

  return (
    <svg
      className={clsx("ecency-source-badge shrink-0 text-gray-300 dark:text-gray-700", className)}
      // Tight square crop of the glyph, so the mark fills the requested box the
      // way the circular asset did instead of floating in its own padding.
      viewBox="40.6 28.7 80.4 80.4"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path d="M88.27,105.71c-9,.08-30.35.27-35.13-.29-3.88-.46-11-3-11.11-12.81C42,87,41.66,64,42.46,59,44.13,48.4,47,41.77,59.05,36.33c10.26-4.44,32.17-.78,34.54,16.93.45,3.37,1.25,3.74,2.49,4,19.61,4.13,24,26.26,14.6,38.32C104.73,103.26,98.31,104.76,88.27,105.71ZM84.71,59.25c.68-11.52-11-19.82-22.82-13.66-8.42,4.39-9.15,10.76-9.68,18-.67,9.2-.25,15.91-.09,25.13.07,4.13,1.27,6.64,5.7,7,1.14.1,17,0,25.22.06,10.74.06,24.06-4.89,21.93-18a12.68,12.68,0,0,0-10.8-10.22,2.12,2.12,0,0,0-2.21,1C85,83,69.66,82.31,63.41,74.46c-5.61-7.06-2.7-18.73,4.68-21.2,2.78-.94,5.11-.11,6.25,1.86,1.84,3.18.11,6.06-2.49,7.65s-2.45,3.92-1.36,5.46c2.56,3.59,7.6,2.88,10.79-.28C83.87,65.4,84.52,62.47,84.71,59.25Z" />
    </svg>
  );
}
