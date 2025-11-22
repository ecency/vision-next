"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMattermostBootstrap } from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import { useClientActiveUser } from "@/api/queries";

export function CommunityChannelClient() {
  const activeUser = useClientActiveUser();
  const params = useParams<{ community: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useMattermostBootstrap(params.community);

  useEffect(() => {
    if (data?.channelId) {
      router.replace(`/chats/${data.channelId}`);
    }
  }, [data?.channelId, router]);

  if (!activeUser) {
    return <LoginRequired />;
  }

  if (!data && !isLoading && error?.message.includes("username")) {
    return <LoginRequired />;
  }

  return (
    <div className="col-span-12 flex justify-center items-center p-10">
      <div className="text-sm text-[--text-muted]">Preparing the community channel…</div>
    </div>
  );
}
