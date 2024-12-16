import { Button } from "@ui/button";
import {
  UilEmoji,
  UilExit,
  UilMicrophone,
  UilMicrophoneSlash
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";

interface Props {
  onLeave: () => void;
}

export function EcencyLiveRoomActions({ onLeave }: Props) {
  const { live, room, activeUserState, activeUserId } = useEcencyLive();

  const prebuiltReactionsList = useMemo(() => ["🔥", "💯", "😀", "🤣", "🤔", "🤘"], []);

  const sendReaction = useCallback((reaction: string) => live?.[1].sendReaction(reaction), [live]);
  const toggleMic = useCallback(() => {
    if (live?.[0].myAudio?.active) {
      live?.[1].setProps("micMuted", !activeUserState?.micMuted);
    } else {
      live?.[1].retryMic();
    }
  }, [live, activeUserState?.micMuted]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.875 }}
      key="actions"
      className="flex items-center gap-2 p-4 justify-center absolute bottom-0 left-0 w-full"
    >
      <AnimatePresence>
        {room?.speakers.includes(activeUserId ?? "") && (
          <motion.div
            key="mic"
            initial={{ opacity: 0, scale: 0.875 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.875 }}
          >
            <Button
              icon={activeUserState?.micMuted ? <UilMicrophoneSlash /> : <UilMicrophone />}
              size="sm"
              className="w-[34px]"
              noPadding={true}
              appearance="secondary"
              onClick={toggleMic}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Dropdown>
        <DropdownToggle>
          <Button
            icon={<UilEmoji />}
            size="sm"
            className="w-[34px]"
            noPadding={true}
            appearance="secondary"
          />
        </DropdownToggle>
        <DropdownMenu align="top" className="!grid grid-cols-3 text-center gap-2 !p-2">
          {prebuiltReactionsList.map((reaction) => (
            <DropdownItem
              className="cursor-pointer !rounded-full !p-2 !text-2xl"
              key={reaction}
              onClick={() => sendReaction(reaction)}
            >
              {reaction}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <Button
        icon={<UilExit />}
        appearance="danger"
        className="text-sm font-semibold"
        onClick={() => {
          live?.[1].leaveRoom();
          onLeave();
        }}
      >
        {i18next.t("live.leave-room")}
      </Button>
    </motion.div>
  );
}
