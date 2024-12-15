import { Button } from "@ui/button";
import { UilEmoji, UilExit } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import { motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";

interface Props {
  onLeave: () => void;
}

export function EcencyLiveRoomActions({ onLeave }: Props) {
  const live = useEcencyLive();

  const prebuiltReactionsList = useMemo(() => ["🔥", "💯", "😀", "🤣", "🤔", "🤘"], []);

  const sendReaction = useCallback((reaction: string) => live?.[1].sendReaction(reaction), [live]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.875 }}
      key="actions"
      className="flex items-center gap-2 p-4 justify-center absolute bottom-0 left-0 w-full"
    >
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
