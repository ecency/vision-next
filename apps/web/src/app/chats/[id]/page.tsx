"use client";

import { useParams } from "next/navigation";
import { MattermostChannelView } from "@/features/chat/mattermost-channel-view";
import { useMattermostBootstrap } from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import Link from "next/link";
import { useClientActiveUser, useHydrated } from "@/api/queries";

export default function ChannelPage() {
  const activeUser = useClientActiveUser();
  const hydrated = useHydrated();
  const params = useParams<{ id: string }>();
  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();

  if (!hydrated) {
    return (
      <div className="col-span-12 flex justify-center items-center p-10">
        <div className="text-sm text-[--text-muted]">Loading chat…</div>
      </div>
    );
  }

  if (!activeUser) {
    return <LoginRequired />;
  }

  if (!bootstrap && !isLoading && error?.message.includes("username")) {
    return <LoginRequired />;
  }

  return (
    <div className="col-span-12 p-4 md:p-10">
      <div className="mb-4">
        <Link href="/chats" className="text-blue-500 text-sm hover:underline">
          ← Back to chats
        </Link>
      </div>
      {params.id && <MattermostChannelView channelId={params.id} />}
    </div>
  );
}
