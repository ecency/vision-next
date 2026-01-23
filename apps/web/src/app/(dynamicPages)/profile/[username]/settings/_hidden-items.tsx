"use client";

import {
  useHiddenMessagesQuery,
  useHiddenChannelsQuery,
  useUnhideMessage,
  useUnhideChannel,
  useClearAllHiddenMessages
} from "@/features/chat/mattermost-api";
import { success } from "@/features/shared";
import { UilEyeSlash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { PopoverConfirm } from "@ui/popover";
import i18next from "i18next";
import { formatRelativeTime } from "@/features/chat/format-utils";

export function HiddenItemsSettings() {
  const { data: hiddenMessages, isLoading: messagesLoading } = useHiddenMessagesQuery();
  const { data: hiddenChannels, isLoading: channelsLoading } = useHiddenChannelsQuery();
  const { mutate: unhideMessage } = useUnhideMessage();
  const { mutate: unhideChannel } = useUnhideChannel();
  const { mutate: clearAll } = useClearAllHiddenMessages();

  if (messagesLoading || channelsLoading) return null;

  const handleUnhideMessage = (postId: string) => {
    unhideMessage(postId, {
      onSuccess: () => {
        success("Message restored");
      },
      onError: (error) => {
        console.error("Failed to unhide message:", error);
      }
    });
  };

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

  const handleClearAll = () => {
    clearAll(undefined, {
      onSuccess: () => {
        success("All hidden messages cleared");
      },
      onError: (error) => {
        console.error("Failed to clear hidden messages:", error);
      }
    });
  };

  const hasHiddenChannels = hiddenChannels && hiddenChannels.channels.length > 0;
  const hasHiddenMessages = hiddenMessages && hiddenMessages.messages.length > 0;

  // Don't render if no hidden items
  if (!hasHiddenChannels && !hasHiddenMessages) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-4">
      <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
        <UilEyeSlash className="w-4 h-4" />
        {i18next.t("settings.hidden-items.title")}
      </div>

      {/* Hidden Conversations */}
      {hasHiddenChannels && (
        <div>
          <div className="text-sm font-semibold px-2 mb-2">
            {i18next.t("settings.hidden-items.conversations")}
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
      )}

      {/* Hidden Messages */}
      {hasHiddenMessages && (
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="text-sm font-semibold">
              {i18next.t("settings.hidden-items.messages")}
            </div>
            {hiddenMessages.messages.length > 0 && (
              <PopoverConfirm
                onConfirm={handleClearAll}
                titleText={i18next.t("settings.hidden-items.confirm-clear")}
              >
                <Button size="sm" appearance="danger" outline={true}>
                  {i18next.t("settings.hidden-items.clear-all")}
                </Button>
              </PopoverConfirm>
            )}
          </div>
          <div className="space-y-2">
            {hiddenMessages.messages.map((message) => (
              <div
                key={message.id}
                className="flex items-center justify-between gap-2 rounded border border-[--border-color] bg-[--background-color] p-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[--text-muted] truncate">
                    ID: {message.id}
                  </div>
                  <div className="text-[11px] text-[--text-muted]">
                    Channel: {message.channelId}
                  </div>
                  <div className="text-[11px] text-[--text-muted]">
                    {i18next.t("settings.hidden-items.hidden-at", {
                      time: formatRelativeTime(message.hiddenAt)
                    })}
                  </div>
                </div>
                <Button
                  size="sm"
                  appearance="secondary"
                  onClick={() => handleUnhideMessage(message.id)}
                >
                  {i18next.t("settings.hidden-items.restore")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
