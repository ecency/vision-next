"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMattermostBootstrap } from "@/features/chat/mattermost-api";
import { LoginRequired } from "@/features/shared";
import { useHydrated } from "@/api/queries";

export function CommunityChannelClient() {
  const { activeUser } = useActiveAccount();
  const hydrated = useHydrated();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useMattermostBootstrap(params.id);

  useEffect(() => {
    if (data?.channelId) {
      router.replace(`/chats/${data.channelId}`);
    } else if (data && !data.channelId) {
      // Log this case for debugging - bootstrap succeeded but no channel was created
      console.error("Community channel bootstrap completed but channelId is missing:", {
        community: params.id,
        bootstrapData: data
      });
    }
  }, [data?.channelId, data, router, params.id]);

  if (!hydrated) {
    return (
      <div className="col-span-12 flex justify-center items-center p-10">
        <div className="text-sm text-[--text-muted]">Loading chats…</div>
      </div>
    );
  }

  if (!activeUser) {
    return <LoginRequired />;
  }

  if (!data && !isLoading && error?.message.includes("username")) {
    return <LoginRequired />;
  }

  if (isLoading || !data) {
    return (
      <div className="col-span-12 flex justify-center items-center p-10">
        <div className="text-sm text-[--text-muted]">Preparing the community channel…</div>
      </div>
    );
  }

  // If bootstrap succeeded but channelId is missing, show error
  if (!data.channelId) {
    return (
      <div className="col-span-12 flex justify-center items-center p-10">
        <div className="flex flex-col items-center gap-3">
          <div className="text-sm text-red-500">
            Unable to prepare the community channel
          </div>
          <div className="text-xs text-[--text-muted]">
            The channel for community "{params.id}" could not be created or found.
          </div>
          <button
            onClick={() => router.push("/chats")}
            className="mt-2 rounded-lg border border-[--border-color] bg-[--surface-color] px-4 py-2 text-sm hover:bg-[--hover-color]"
          >
            Go to Chats
          </button>
        </div>
      </div>
    );
  }

  // Only show "Redirecting..." if we have a valid channelId
  return (
    <div className="col-span-12 flex justify-center items-center p-10">
      <div className="text-sm text-[--text-muted]">Redirecting…</div>
    </div>
  );
}
