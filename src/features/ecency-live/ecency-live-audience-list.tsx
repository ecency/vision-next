import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import useMount from "react-use/lib/useMount";
import { useState } from "react";
import { StateType } from "jam-core";
import { UserAvatar } from "@/features/shared";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";

type PeerState = StateType["peerState"][1] & { displayName: string | undefined };
type Reactions = Record<string, [reaction: string, time: number][]>;

export function EcencyLiveAudienceList() {
  const live = useEcencyLive();

  const [peers, setPeers] = useState<[string, PeerState][]>([]);
  const [identities, setIdentities] = useState<StateType["identities"]>({});
  const [reactions, setReactions] = useState<Reactions>({});

  useMount(() => {
    live?.[1].onState("peerState", (peerState) =>
      setPeers(Object.entries(peerState as Record<string, PeerState>))
    );
    live?.[1].onState("identities", (identities) =>
      setIdentities({
        ...(identities as StateType["identities"]),
        [live?.[0].myIdentity?.publicKey ?? ""]: live?.[0].myIdentity?.info ?? {}
      })
    );
    live?.[1].onState("reactions", (value) => {
      setReactions((reactions) =>
        Object.entries(value as Reactions).reduce(
          (acc, [peer, reaction]) => ({
            ...acc,
            [peer]: [...reaction]
          }),
          { ...reactions }
        )
      );
    });
  });

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="text-sm font-semibold opacity-50">{i18next.t("live.audience")}</div>
      <motion.div
        transition={{ delayChildren: 0.1 }}
        className="grid grid-cols-3 lg:grid-cols-4 text-center gap-4 items-center"
      >
        <AnimatePresence mode="popLayout">
          {peers.map(([peer, peerState]) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.875 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.875 }}
              className="flex flex-col items-center gap-2 relative"
              key={peer}
            >
              <AnimatePresence mode="popLayout">
                {reactions[peer]?.map((reaction, i) => (
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
              <UserAvatar username={identities[peer]?.name ?? ""} size="medium" />
              <div className="flex items-center gap-2 text-sm">
                <div className="font-semibold">{identities[peer]?.name ?? "Anonymous"}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
