"use client";

import { InstanceConfigManager, t } from "@/core";
import { useInstanceConfig } from "@/features/blog/hooks/use-instance-config";
import { UilPen } from "@tooni/iconscout-unicons-react";
import { Link } from "@tanstack/react-router";
import { useIsAuthEnabled, useIsAuthenticated, useIsBlogOwner } from "../hooks";

const BUTTON_CLASS =
  "fixed bottom-6 right-30 z-50 px-4 py-2 flex items-center text-sm !no-underline rounded-full border border-gray-400 dark:border-gray-600 !font-serif";

export function CreatePostButton() {
  const isBlogOwner = useIsBlogOwner();
  const isAuthEnabled = useIsAuthEnabled();
  const isAuthenticated = useIsAuthenticated();
  const { isCommunityMode } = useInstanceConfig();

  const createPostUrl = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.general.createPostUrl || "https://ecency.com/publish",
  );

  // Community instances: any authenticated user can post into the community
  // (standard Hive community moderation still applies). Blog instances: only
  // the instance owner can post.
  const canCreatePost = isCommunityMode ? isAuthenticated : isBlogOwner;

  if (!isAuthEnabled || !canCreatePost) {
    return null;
  }

  // Community: use the built-in /publish editor, which publishes INTO the community
  // (parentPermlink = communityId). Sending members to the external composer would
  // lose the community target and post to their own blog instead.
  if (isCommunityMode) {
    return (
      <Link to="/publish" className={BUTTON_CLASS}>
        <UilPen className="size-4" />
        <span className="hidden sm:block">{t("create_post")}</span>
      </Link>
    );
  }

  return (
    <a
      href={createPostUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={BUTTON_CLASS}
    >
      <UilPen className="size-4" />
      <span className="hidden sm:block">{t("create_post")}</span>
    </a>
  );
}
