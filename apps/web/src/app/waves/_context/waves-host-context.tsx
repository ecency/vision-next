"use client";

import { PREFIX } from "@/utils/local-storage";
import { WaveHosts } from "@/features/waves/enums";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo
} from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";

interface WavesHostContextValue {
  host: string;
  setHost: (nextHost: string) => void;
}

const DEFAULT_HOST = WaveHosts.Waves;

const WavesHostContext = createContext<WavesHostContextValue | undefined>(undefined);

export function WavesHostProvider({ children }: PropsWithChildren) {
  const [storedHost, setStoredHost] = useLocalStorage<string>(PREFIX + "_wh", DEFAULT_HOST);

  const host = storedHost ?? DEFAULT_HOST;

  const setHost = useCallback(
    (nextHost: string) => {
      setStoredHost(nextHost);
    },
    [setStoredHost]
  );

  const value = useMemo(
    () => ({
      host,
      setHost
    }),
    [host, setHost]
  );

  return <WavesHostContext.Provider value={value}>{children}</WavesHostContext.Provider>;
}

export function useWavesHost() {
  const context = useContext(WavesHostContext);

  if (!context) {
    throw new Error("useWavesHost must be used within a WavesHostProvider");
  }

  return context;
}

export function useOptionalWavesHost() {
  return useContext(WavesHostContext);
}
