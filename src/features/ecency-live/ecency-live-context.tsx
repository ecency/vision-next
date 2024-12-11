"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { createJam, importDefaultIdentity } from "jam-core";
import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { useAsync } from "react-use";

export const EcencyLiveContext = createContext<{
  jamInstance: ReturnType<typeof createJam> | undefined;
}>({
  jamInstance: [] as any
});

export function useEcencyLive() {
  const { jamInstance } = useContext(EcencyLiveContext);

  return jamInstance;
}

export function EcencyLiveManager(props: PropsWithChildren) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const [jamInstance, setJamInstance] = useState<ReturnType<typeof createJam>>();

  useAsync(async () => {
    if (!activeUser) {
      return;
    }

    await importDefaultIdentity({
      seed: "Ecency like",
      info: { name: activeUser.username }
    });
    const jam = createJam({
      debug: false,
      jamConfig: {
        domain: EcencyConfigManager.getConfigValue((config) => config.visionFeatures.jam.domain)
      }
    });
    setJamInstance(jam);
  }, [activeUser]);

  useEffect(() => {
    if (jamInstance) {
      jamInstance[1].setProps({ userInteracted: true });
    }
  }, [jamInstance]);

  return (
    <EcencyLiveContext.Provider value={{ jamInstance }}>
      {props.children}
    </EcencyLiveContext.Provider>
  );
}
