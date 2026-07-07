"use client";

import { InstanceConfigManager, t } from "@/core";
import { useInstanceConfig } from "@/features/blog/hooks/use-instance-config";
import { UilPen } from "@tooni/iconscout-unicons-react";
import { useIsAuthEnabled, useIsAuthenticated, useIsBlogOwner } from "../hooks";

export function CreatePostButton() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();
  const isAuthenticated = useIsAuthenticated();
  const { isCommunityMode } = useInstanceConfig();

  const createPostUrl = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.general.createPostUrl || "https://ecency.com/submit",
  );

  // Community instances: any authenticated user can post into the community
  // (standard Hive community moderation still applies). Blog instances: only
  // the instance owner can post.
  const canCreatePost = isCommunityMode ? isAuthenticated : isBlogOwner;

  if (!isAuthEnabled || !canCreatePost) {
    return null;
  }

  return (
    <a
      href={createPostUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-30 z-50 px-4 py-2 flex items-center text-sm !no-underline rounded-full border border-gray-400 dark:border-gray-600 !font-serif"
    >
      <UilPen className="w-4 h-4" />
      <span className="hidden sm:block">{t("create_post")}</span>
    </a>
  );
}
