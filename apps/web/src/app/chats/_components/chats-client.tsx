"use client";

import { useMattermostBootstrap, useMattermostChannels } from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import Link from "next/link";
import { useClientActiveUser } from "@/api/queries";

export function ChatsClient() {
  const activeUser = useClientActiveUser();

  if (!activeUser) {
    return <LoginRequired />;
  }

  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();
  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError
  } = useMattermostChannels(Boolean(bootstrap?.ok));

  return (
    <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <h1 className="text-2xl font-semibold mb-2">Chats</h1>
          <p className="text-[--text-muted] text-sm">
            Your Ecency account is automatically provisioned inside Mattermost. Channels and direct
            messages stay inside Ecency UI while Mattermost handles delivery.
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error.message}</div>}

        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Channels</h2>
            {(isLoading || channelsLoading) && <div className="text-xs text-[--text-muted]">Loading…</div>}
          </div>
          {channelsError && (
            <div className="text-sm text-red-500">{(channelsError as Error).message}</div>
          )}
          <div className="grid gap-2">
            {channels?.channels?.map((channel) => (
              <Link
                href={`/chats/${channel.id}`}
                key={channel.id}
                className="rounded border border-[--border-color] p-3 hover:border-blue-500 transition"
              >
                <div className="font-semibold">{channel.display_name || channel.name}</div>
                <div className="text-xs text-[--text-muted]">{channel.type === "D" ? "DM" : "Channel"}</div>
              </Link>
            ))}
            {!channels?.channels?.length && !channelsLoading && (
              <div className="text-sm text-[--text-muted]">No channels assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
