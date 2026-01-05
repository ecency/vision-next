"use client";

import { useParams } from "next/navigation";
import { MattermostChannelView } from "@/features/chat/mattermost-channel-view";
import { useMattermostBootstrap } from "@/features/chat/mattermost-api";
import { ChatErrorBoundary } from "@/features/chat/chat-error-boundary";
import { LoginRequired } from "@/features/shared";
import { useHydrated } from "@/api/queries";

export default function ChannelPage() {
  const { activeUser } = useActiveAccount();
  const hydrated = useHydrated();
  const params = useParams<{ id: string }>();
  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-[--text-muted]">Loading chat…</div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <LoginRequired />
      </div>
    );
  }

  if (!bootstrap && !isLoading && error?.message.includes("username")) {
    return <LoginRequired />;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-[--text-muted]">Loading chat…</div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-sm text-[--text-muted]">Unable to initialize chat</div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="h-full">
        {params.id && <MattermostChannelView channelId={params.id} />}
      </div>
    </ChatErrorBoundary>
  );
}
