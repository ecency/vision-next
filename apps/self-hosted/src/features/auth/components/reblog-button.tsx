"use client";

import { ReblogButton as BaseReblogButton } from "@ecency/ui";
import { UilRedo } from "@tooni/iconscout-unicons-react";
import { useCallback } from "react";
import { useReblog } from "@ecency/sdk";
import { t } from "@/core";
import { createBroadcastAdapter } from "@/providers/sdk";
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from "../hooks";

interface ReblogButtonProps {
  author: string;
  permlink: string;
  reblogCount?: number;
  className?: string;
}

function ReblogIcon({ className }: { className?: string }) {
  return <UilRedo className={className} />;
}

export function ReblogButton({
  author,
  permlink,
  reblogCount = 0,
  className,
}: ReblogButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();

  const adapter = createBroadcastAdapter();
  const reblogMutation = useReblog(user?.username, { adapter });

  const handleReblog = useCallback(async () => {
    if (!user) return;

    await reblogMutation.mutateAsync({ author, permlink });
  }, [user, author, permlink, reblogMutation]);

  return (
    <BaseReblogButton
      author={author}
      permlink={permlink}
      reblogCount={reblogCount}
      currentUser={user?.username}
      isReblogEnabled={isAuthEnabled}
      isAuthenticated={isAuthenticated}
      onReblog={handleReblog}
      className={className}
      labels={{
        reblogs: t("reblogs"),
        reblogging: t("reblogging"),
        confirmMessage: t("reblog_confirm"),
        loginTitle: t("login_to_reblog"),
        ownPostTitle: t("cant_reblog_own"),
        rebloggedTitle: t("already_reblogged"),
        reblogTitle: t("reblog_to_followers"),
      }}
      icon={<ReblogIcon className="w-4 h-4" />}
    />
  );
}
