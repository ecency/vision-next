import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import useMount from "react-use/lib/useMount";
import { useMemo, useState } from "react";
import { StateType } from "jam-core";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { EcencyLiveAudienceItem } from "@/features/ecency-live/ecency-live-audience-item";

type PeerState = StateType["peerState"][1] & { displayName: string | undefined };
type Reactions = Record<string, [reaction: string, time: number][]>;

export function EcencyLiveAudienceList() {
  const { live, room } = useEcencyLive();

  const [peers, setPeers] = useState<[string, PeerState][]>([]);
  const [identities, setIdentities] = useState<StateType["identities"]>({});
  const [reactions, setReactions] = useState<Reactions>({});

  const speakers = useMemo(
    () => peers.filter(([peer]) => room?.speakers.includes(peer)),
    [peers, room?.speakers]
  );
  const audience = useMemo(
    () => peers.filter(([peer]) => !room?.speakers.includes(peer)),
    [peers, room?.speakers]
  );

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
      <div className="text-sm font-semibold opacity-50">{i18next.t("live.speakers")}</div>
      <motion.div
        transition={{ delayChildren: 0.1 }}
        className="grid grid-cols-3 text-center gap-4 items-center"
      >
        <AnimatePresence mode="popLayout">
          {speakers.map(([speaker, speakerState]) => (
            <EcencyLiveAudienceItem
              state={speakerState}
              isSpeaker={true}
              key={speaker}
              peer={speaker}
              identity={identities[speaker]}
              reactions={reactions[speaker] ?? []}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div
        transition={{ delayChildren: 0.1 }}
        className="grid grid-cols-3 lg:grid-cols-4 text-center gap-4 items-center"
      >
        <AnimatePresence mode="popLayout"></AnimatePresence>
      </motion.div>

      <div className="text-sm font-semibold opacity-50">{i18next.t("live.audience")}</div>
      <motion.div
        transition={{ delayChildren: 0.1 }}
        className="grid grid-cols-3 lg:grid-cols-4 text-center gap-4 items-center"
      >
        <AnimatePresence mode="popLayout">
          {audience.map(([peer, peerState]) => (
            <EcencyLiveAudienceItem
              state={peerState}
              key={peer}
              peer={peer}
              identity={identities[peer]}
              reactions={reactions[peer] ?? []}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
