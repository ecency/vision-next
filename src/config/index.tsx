import config from "./config";
import { ComponentType, memo, PropsWithChildren, ReactNode, useMemo } from "react";
import { QueryClient, useMutation, UseMutationOptions } from "@tanstack/react-query";
import type { DefaultError } from "@tanstack/query-core";

export namespace EcencyConfigManager {
  export const CONFIG = { ...config.visionConfig } as const;

  export type ConfigBasedCondition<T = boolean> = (config: typeof CONFIG) => T;

  export function getConfigValue<T>(condition: ConfigBasedCondition<T>): T {
    return condition(CONFIG);
  }

  export function selector(condition: ConfigBasedCondition) {
    return condition(CONFIG);
  }

  export function withConditional<T>(condition: ConfigBasedCondition, callback: () => T) {
    if (condition(CONFIG)) {
      return callback();
    }
  }

  export function useConfig(condition: ConfigBasedCondition) {
    return useMemo(() => condition(CONFIG), [condition]);
  }

  /**
   * Use it for more declarative spreading operations
   */
  export function composeConditionals<T extends ReturnType<typeof withConditional>>(
    ...withConditionals: T[]
  ): NonNullable<T>[] {
    return withConditionals.filter((c) => !!c) as NonNullable<T>[];
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

  export const useConditionalMutation = <
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown
  >(
    condition: ConfigBasedCondition,
    options: UseMutationOptions<TData, TError, TVariables, TContext>,
    queryClient?: QueryClient
  ) =>
    useMutation(
      {
        ...options,
        mutationFn: (args) => {
          if (condition(CONFIG) && options.mutationFn) {
            return options.mutationFn(args);
          }

          if (!options.mutationFn) {
            throw new Error("Called conditional mutation w/o mutationFn");
          }

          throw new Error("Called conditional mutation which isn`t configured");
        }
      },
      queryClient
    );

  interface ConditionalProps extends PropsWithChildren {
    condition: ConfigBasedCondition;
    fallback?: ReactNode;
  }

  export const Conditional = memo<ConditionalProps>((props) => {
    if (props.condition(CONFIG)) {
      return props.children ?? <></>;
    }

    return props.fallback ?? <></>;
  });
  Conditional.displayName = "ConditionalByConfig";
}
