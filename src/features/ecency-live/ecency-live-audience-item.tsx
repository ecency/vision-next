import { AnimatePresence, motion } from "framer-motion";
import { UserAvatar } from "@/features/shared";
import { IdentityInfo, StateType } from "jam-core";
import { UilMicrophoneSlash } from "@tooni/iconscout-unicons-react";

type PeerState = StateType["peerState"][1] & { displayName: string | undefined };

interface Props {
  peer: string;
  state: PeerState;
  identity?: IdentityInfo;
  reactions: [reaction: string, time: number][];
  isSpeaker?: boolean;
}

export function EcencyLiveAudienceItem({
  peer,
  identity,
  reactions,
  isSpeaker = false,
  state
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.875 }}
      className="flex flex-col items-center gap-2 relative"
      key={peer}
    >
      <AnimatePresence mode="popLayout">
        {reactions.map((reaction, i) => (
          <motion.div
            className="absolute top-0 right-0 bg-gray-200 dark:bg-gray-800 text-lg py-0.5 px-2 rounded-2xl border border-[--border-color]"
            key={"reaction_" + peer + reaction[1]}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {reaction[0]}
          </motion.div>
        ))}
      </AnimatePresence>

      {isSpeaker && state.micMuted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.875 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.875 }}
          className="absolute bottom-8 right-4 bg-gray-200 dark:bg-gray-800 text-lg w-8 h-8 rounded-2xl border border-[--border-color]"
        >
          <UilMicrophoneSlash className="w-4 h-4 opacity-75" />
        </motion.div>
      )}

      <UserAvatar username={identity?.name ?? ""} size={isSpeaker ? "large" : "medium"} />
      <div className="flex items-center gap-2 text-sm">
        <div className="font-semibold">{identity?.name ?? "Anonymous"}</div>
      </div>
    </motion.div>
  );
}
