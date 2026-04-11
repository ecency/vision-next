import { CONFIG, getBoundFetch, getQueryClient, QueryKeys } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import type { AiAssistResponse } from "../types";

export interface AiAssistParams {
  action: string;
  text: string;
  code?: string;
}

export function useAiAssist(
  username: string | undefined,
  accessToken: string | undefined,
) {
  return useMutation({
    mutationKey: ["ai", "assist"],
    mutationFn: async (params: AiAssistParams): Promise<AiAssistResponse> => {
      if (!username) {
        throw new Error(
          "[SDK][AI][Assist] – username wasn't provided"
        );
      }

      if (!accessToken) {
        throw new Error(
          "[SDK][AI][Assist] – access token wasn't found"
        );
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/ai-assist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: params.code ?? accessToken,
            us: username,
            action: params.action,
            text: params.text,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(body);
        } catch {
          // not JSON
        }

        const err = new Error(
          `[SDK][AI][Assist] – failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
        (err as any).status = response.status;
        (err as any).data = parsed;
        throw err;
      }

      return (await response.json()) as AiAssistResponse;
    },
    onSuccess: (data) => {
      if (username) {
        // Invalidate points cache if cost was charged
        if (data.cost > 0) {
          getQueryClient().invalidateQueries({
            queryKey: QueryKeys.points._prefix(username),
          });
        }
        // Invalidate assist prices to refresh free_remaining counts
        getQueryClient().invalidateQueries({
          queryKey: QueryKeys.ai.assistPrices(username),
        });
      }
    },
  });
}
