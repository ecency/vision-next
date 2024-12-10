"use client";

import { createContext, PropsWithChildren, useContext, useState } from "react";
import { createJam } from "jam-core";
import { EcencyConfigManager } from "@/config";

export const EcencyLiveContext = createContext<{
  jamInstance: ReturnType<typeof createJam>;
}>({
  jamInstance: [] as any
});

export function useEcencyLive() {
  const { jamInstance } = useContext(EcencyLiveContext);

  return jamInstance;
}

export function EcencyLiveManager(props: PropsWithChildren) {
  const [jamInstance, setJamInstance] = useState(
    createJam({
      debug: false,
      jamConfig: {
        domain: EcencyConfigManager.getConfigValue((config) => config.visionFeatures.jam.domain)
      }
    })
  );

  return (
    <EcencyLiveContext.Provider value={{ jamInstance }}>
      {props.children}
    </EcencyLiveContext.Provider>
  );
}
