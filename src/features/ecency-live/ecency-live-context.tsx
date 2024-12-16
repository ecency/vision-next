"use client";

import { createContext, PropsWithChildren, useContext, useState } from "react";
import { createJam, importDefaultIdentity, RoomType } from "jam-core";
import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { useAsync } from "react-use";
import { PeerState } from "./types";

export const EcencyLiveContext = createContext<{
  live: ReturnType<typeof createJam> | undefined;
  room: RoomType | undefined;
  activeUserState: PeerState | undefined;
  activeUserId: string | undefined;
}>({
  live: [] as any,
  room: undefined,
  activeUserState: undefined,
  activeUserId: undefined
});

export function useEcencyLive() {
  return useContext(EcencyLiveContext);
}

export function EcencyLiveManager(props: PropsWithChildren) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const [jamInstance, setJamInstance] = useState<ReturnType<typeof createJam>>();
  const [room, setRoom] = useState<RoomType>();

  const [activeUserId, setActiveUserId] = useState<string>();
  const [activeUserState, setActiveUserState] = useState<PeerState>();

  useAsync(async () => {
    if (!activeUser) {
      return;
    }

    await importDefaultIdentity({
      seed: "Ecency like",
      info: { name: activeUser.username }
    });
    const live = createJam({
      debug: false,
      jamConfig: {
        domain: EcencyConfigManager.getConfigValue((config) => config.visionFeatures.jam.domain)
      }
    });
    setJamInstance(live);

    // Fill props
    await live[1].setProps("userInteracted", true);

    // Fill the state
    setRoom(live[0].room.name !== "" ? live[0].room : undefined);
    setActiveUserId(live[0].myId ?? undefined);
    setActiveUserState(live[0].myPeerState as PeerState);

    // Register listeners
    live[1].onState("inRoom", (value) => !value && setRoom(undefined));
    live[1].onState("room", (value: any) => setRoom(value.name !== "" ? value : undefined));
    live[1].onState("myId", (value) => setActiveUserId(value as string));
    live[1].onState("myPeerState", (state) => setActiveUserState(state as PeerState));
  }, [activeUser]);

  return (
    <EcencyLiveContext.Provider value={{ live: jamInstance, room, activeUserState, activeUserId }}>
      {props.children}
    </EcencyLiveContext.Provider>
  );
}
