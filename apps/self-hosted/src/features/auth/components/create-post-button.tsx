"use client";

import { InstanceConfigManager, t } from "@/core";
import { Link } from "@tanstack/react-router";
import { UilPen } from "@tooni/iconscout-unicons-react";
import { useIsAuthEnabled, useIsBlogOwner } from "../hooks";

export function CreatePostButton() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();

  const createPostUrl = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.general.createPostUrl || "https://ecency.com/submit",
  );

  // Only show for blog owner when auth is enabled
  if (!isAuthEnabled || !isBlogOwner) {
    return null;
  }

  return (
    <Link
      to={createPostUrl}
      className="fixed bottom-6 right-30 z-50 px-4 py-2 flex items-center text-sm !no-underline rounded-full border border-gray-400 dark:border-gray-600 !font-serif"
    >
      <UilPen className="w-4 h-4" />
      <span className="hidden sm:block">{t("create_post")}</span>
    </Link>
  );
}
