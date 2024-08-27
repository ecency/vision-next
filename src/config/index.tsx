import config from "./ecency-config.json";
import { ComponentType, memo, PropsWithChildren, ReactNode, useEffect } from "react";

export namespace EcencyConfigManager {
  export const CONFIG = { ...config.visionConfig } as const;

  type ConfigBasedCondition = (config: typeof CONFIG) => boolean;

  export function useConditionallyEffect<T>(
    condition: ConfigBasedCondition,
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

  export function withConditionalComponent<F, CT>(
    condition: ConfigBasedCondition,
    component: ComponentType<CT>,
    fallback: () => F
  ) {
    if (condition(CONFIG)) {
      return component;
    }

    return fallback();
  }

  interface ConditionalProps extends PropsWithChildren {
    condition: ConfigBasedCondition;
    fallback?: ReactNode;
  }

  export const Conditional = memo<ConditionalProps>((props) => {
    if (props.condition(CONFIG)) {
      return props.children;
    }

    return props.fallback ?? <></>;
  });
  Conditional.displayName = "ConditionalByConfig";
}
