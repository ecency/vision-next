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
import { useCallback, useMemo, useState } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { useMount } from "react-use";
import { StateType } from "jam-core";

type PeerState = StateType["peerState"][1];

interface Props {
  onLeave: () => void;
}

export function EcencyLiveRoomActions({ onLeave }: Props) {
  const live = useEcencyLive();

  const [currentUser, setCurrentUser] = useState<string>();
  const [room, setRoom] = useState<StateType["room"]>();
  const [state, setState] = useState<PeerState>();
  const prebuiltReactionsList = useMemo(() => ["🔥", "💯", "😀", "🤣", "🤔", "🤘"], []);

  const sendReaction = useCallback((reaction: string) => live?.[1].sendReaction(reaction), [live]);
  const toggleMic = useCallback(() => {
    if (live?.[0].myAudio?.active) {
      live?.[1].setProps("micMuted", !state?.micMuted);
    } else {
      live?.[1].retryMic();
    }
  }, [live, state?.micMuted]);

  useMount(() => {
    setCurrentUser(live?.[0].myId ?? undefined);
    setRoom(live?.[0].room);
    setState(live?.[0].myPeerState as PeerState);

    live?.[1].onState("myPeerState", (state) => setState(state as PeerState));
    live?.[1].onState("room", (value) => setRoom(value as StateType["room"]));
    live?.[1].onState("myId", (value) => setCurrentUser(value as string));
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.875 }}
      key="actions"
      className="flex items-center gap-2 p-4 justify-center absolute bottom-0 left-0 w-full"
    >
      <AnimatePresence>
        {room?.speakers.includes(currentUser ?? "") && (
          <motion.div
            key="mic"
            initial={{ opacity: 0, scale: 0.875 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.875 }}
          >
            <Button
              icon={state?.micMuted ? <UilMicrophoneSlash /> : <UilMicrophone />}
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
