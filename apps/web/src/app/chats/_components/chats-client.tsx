"use client";

import {
  useMattermostBootstrap,
  useMattermostChannels,
  useMattermostDirectChannel
} from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import Link from "next/link";
import { useClientActiveUser, useHydrated } from "@/api/queries";
import { useRouter } from "next/navigation";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { useState } from "react";

export function ChatsClient() {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const router = useRouter();
  const [dmUsername, setDmUsername] = useState("");

  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();
  const {
    data: channels,
    isLoading: channelsLoading,
    error: channelsError
  } = useMattermostChannels(Boolean(bootstrap?.ok));
  const directChannelMutation = useMattermostDirectChannel();

  if (!hydrated) {
    return (
      <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
        <div className="text-sm text-[--text-muted]">Loading chats…</div>
      </div>
    );
  }

  if (!activeUser) {
    return <LoginRequired />;
  }

  return (
    <div className="col-span-12 flex justify-center items-center p-4 md:p-10">
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4">
          <h1 className="text-2xl font-semibold mb-2">Chats</h1>
          <p className="text-[--text-muted] text-sm">
            Your Ecency/Hive account is automatically provisioned inside Ecency Chats.
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error.message}</div>}

        <div className="rounded border border-[--border-color] bg-[--surface-color] p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Direct messages</h2>
            <p className="text-xs text-[--text-muted]">
              Start a private conversation with another Ecency user.
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const username = dmUsername.trim();
                if (!username) return;

                directChannelMutation.mutate(username, {
                  onSuccess: (data) => {
                    setDmUsername("");
                    router.push(`/chats/${data.channelId}`);
                  }
                });
              }}
            >
              <FormControl
                placeholder="Enter Hive username"
                value={dmUsername}
                onChange={(e) => setDmUsername(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={directChannelMutation.isLoading}>
                {directChannelMutation.isLoading ? "Starting…" : "Start DM"}
              </Button>
            </form>
            {directChannelMutation.error && (
              <div className="text-sm text-red-500 mt-2">
                {(directChannelMutation.error as Error).message}
              </div>
            )}
          </div>

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
