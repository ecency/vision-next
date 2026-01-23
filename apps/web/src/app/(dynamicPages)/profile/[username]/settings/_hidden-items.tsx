"use client";

import {
  useHiddenChannelsQuery,
  useUnhideChannel
} from "@/features/chat/mattermost-api";
import { success } from "@/features/shared";
import { UilEyeSlash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import i18next from "i18next";
import { formatRelativeTime } from "@/features/chat/format-utils";

export function HiddenItemsSettings() {
  const { data: hiddenChannels, isLoading: channelsLoading } = useHiddenChannelsQuery();
  const { mutate: unhideChannel } = useUnhideChannel();

  if (channelsLoading) return null;

  const handleUnhideChannel = (channelId: string) => {
    unhideChannel(channelId, {
      onSuccess: () => {
        success("Conversation restored");
      },
      onError: (error) => {
        console.error("Failed to unhide channel:", error);
      }
    });
  };

  const hasHiddenChannels = hiddenChannels && hiddenChannels.channels.length > 0;

  // Don't render if no hidden channels
  if (!hasHiddenChannels) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-4">
      <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
        <UilEyeSlash className="w-4 h-4" />
        {i18next.t("settings.hidden-items.title")}
      </div>

      <div className="space-y-2">
        {hiddenChannels.channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between gap-2 rounded border border-[--border-color] bg-[--background-color] p-2"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[--text-muted] truncate">
                ID: {channel.id}
              </div>
              <div className="text-[11px] text-[--text-muted]">
                {i18next.t("settings.hidden-items.hidden-at", {
                  time: formatRelativeTime(channel.hiddenAt)
                })}
              </div>
            </div>
            <Button
              size="sm"
              appearance="secondary"
              onClick={() => handleUnhideChannel(channel.id)}
            >
              {i18next.t("settings.hidden-items.restore")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
