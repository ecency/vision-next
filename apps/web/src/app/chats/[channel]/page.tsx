"use client";

import { useParams } from "next/navigation";
import { MattermostChannelView } from "@/features/chat/mattermost-channel-view";
import { useMattermostBootstrap } from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import Link from "next/link";
import { useClientActiveUser } from "@/api/queries";

export default function ChannelPage() {
  const activeUser = useClientActiveUser();
  const params = useParams<{ channel: string }>();
  const { data: bootstrap, isLoading, error } = useMattermostBootstrap();

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
      {params.channel && <MattermostChannelView channelId={params.channel} />}
    </div>
  );
}
