import config from "./ecency-config.json";
import { useEffect } from "react";

export namespace EcencyConfigManager {
  export const CONFIG = { ...config.visionConfig } as const;

  export function useConditionallyEffect<T>(
    condition: (config: typeof CONFIG) => boolean,
    callback: () => void,
    deps: T[]
  ) {
    return useEffect(() => {
      if (condition(CONFIG)) {
        callback();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callback, condition, ...deps]);
  }
}