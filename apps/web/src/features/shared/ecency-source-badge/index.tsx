import { appName } from "@/utils";
import clsx from "clsx";
import i18next from "i18next";
import Image from "next/image";
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
    <Image
      className={clsx("ecency-source-badge", className)}
      src="/assets/logo-circle.svg"
      alt={label}
      title={label}
      width={size}
      height={size}
    />
  );
}
