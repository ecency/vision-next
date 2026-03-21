import { CONFIG, getBoundFetch, getQueryClient, QueryKeys } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import type { AiGenerationResponse } from "../types";

export interface GenerateImageParams {
  prompt: string;
  aspect_ratio?: string;
  power?: number;
}

export function useGenerateImage(
  username: string | undefined,
  accessToken: string | undefined,
) {
  return useMutation({
    mutationKey: ["ai", "generate-image"],
    mutationFn: async (params: GenerateImageParams): Promise<AiGenerationResponse> => {
      if (!username) {
        throw new Error(
          "[SDK][AI][GenerateImage] – username wasn't provided"
        );
      }

      if (!accessToken) {
        throw new Error(
          "[SDK][AI][GenerateImage] – access token wasn't found"
        );
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/ai-generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: accessToken,
            us: username,
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio ?? "1:1",
            power: params.power ?? 1,
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
          `[SDK][AI][GenerateImage] – failed with status ${response.status}${body ? `: ${body}` : ""}`
        );
        (err as any).status = response.status;
        (err as any).data = parsed;
        throw err;
      }

      return (await response.json()) as AiGenerationResponse;
    },
    onSuccess: () => {
      // Invalidate points cache since balance changed
      if (username) {
        getQueryClient().invalidateQueries({
          queryKey: QueryKeys.points._prefix(username),
        });
      }
    },
  });
}
