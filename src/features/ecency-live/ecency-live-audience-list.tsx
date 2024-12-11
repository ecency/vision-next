import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import useMount from "react-use/lib/useMount";
import { useState } from "react";
import { StateType } from "jam-core";
import { UserAvatar } from "@/features/shared";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";

type PeerState = StateType["peerState"][1] & { displayName: string | undefined };

export function EcencyLiveAudienceList() {
  const live = useEcencyLive();

  const [peers, setPeers] = useState<[string, PeerState][]>([]);
  const [identities, setIdentities] = useState<StateType["identities"]>({});

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
  });

  return (
    <div>
      <div className="text-sm font-semibold opacity-50 pb-4 pt-6 px-4">
        {i18next.t("live.audience")}
      </div>
      <motion.div
        transition={{ delayChildren: 0.1 }}
        className="grid grid-cols-3 text-center gap-4 items-center"
      >
        <AnimatePresence mode="popLayout">
          {peers.map(([peer, peerState]) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.875 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.875 }}
              className="flex flex-col items-center gap-2"
              key={peer}
            >
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
