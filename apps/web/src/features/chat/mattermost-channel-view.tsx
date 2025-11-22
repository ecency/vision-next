"use client";

import { useMemo, useState } from "react";
import { useMattermostPosts, useMattermostSendMessage } from "./mattermost-api";
import { Button } from "@ui/button";
import { FormControl } from "@ui/form";

interface Props {
  channelId: string;
}

export function MattermostChannelView({ channelId }: Props) {
  const { data, isLoading, error } = useMattermostPosts(channelId);
  const [message, setMessage] = useState("");
  const sendMutation = useMattermostSendMessage(channelId);

  const posts = useMemo(() => data?.posts ?? [], [data?.posts]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-[--border-color] bg-[--background-color] p-4 h-[60vh] overflow-y-auto">
        {isLoading && <div className="text-sm text-[--text-muted]">Loading messages…</div>}
        {error && (
          <div className="text-sm text-red-500">{(error as Error).message || "Failed to load"}</div>
        )}
        {!isLoading && !posts.length && (
          <div className="text-sm text-[--text-muted]">No messages yet. Say hello!</div>
        )}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-1">
              <div className="text-xs text-[--text-muted]">{post.user_id}</div>
              <div className="rounded bg-[--surface-color] p-3 text-sm whitespace-pre-wrap">
                {post.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          sendMutation.mutate(message, {
            onSuccess: () => setMessage("")
          });
        }}
      >
        <FormControl
          as="textarea"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message"
          className="flex-1"
        />
        <Button type="submit" disabled={sendMutation.isLoading}>
          {sendMutation.isLoading ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
