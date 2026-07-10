import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { EcencyAnalytics } from "@/modules/analytics";
import { useMutation } from "@tanstack/react-query";
import { getPointsQueryOptions } from "../queries";
import type { Points } from "../types";

/**
 * POST a points claim and return the parsed JSON body.
 *
 * The endpoint normally answers with JSON, but an edge/proxy layer can
 * occasionally return a 2xx whose body is an HTML interstitial or plain text
 * (ECENCY-NEXT-1FCJ). Calling `response.json()` on that throws a bare
 * `SyntaxError` that names neither the endpoint nor the cause. Instead we check
 * the content type first and fail with a STABLE, low-cardinality message
 * (content type + status) — never the raw body — so these group as a single
 * Sentry issue instead of fragmenting on every distinct HTML page.
 */
export async function claimPointsRequest(
  username: string | undefined,
  accessToken: string | undefined
) {
  if (!username) {
    throw new Error("[SDK][Points][Claim] – username wasn't provided");
  }

  if (!accessToken) {
    throw new Error("[SDK][Points][Claim] – access token wasn't found");
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost + "/private-api/points-claim",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: accessToken }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 406) {
      try {
        return JSON.parse(body);
      } catch {
        return { message: body, code: response.status };
      }
    }
    throw new Error(
      `[SDK][Points][Claim] – failed with status ${response.status}${body ? `: ${body}` : ""}`
    );
  }

  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim();
  const body = await response.text();

  if (!contentType.includes("json")) {
    throw new Error(
      `[SDK][Points][Claim] – expected JSON but received "${contentType || "empty"}" response (status ${response.status})`
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(
      `[SDK][Points][Claim] – malformed JSON response (status ${response.status})`
    );
  }
}

export function useClaimPoints(
  username: string | undefined,
  accessToken: string | undefined,
  onSuccess?: () => void,
  onError?: Parameters<typeof useMutation>["0"]["onError"]
) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "points-claimed"
  );

  return useMutation({
    mutationFn: () => claimPointsRequest(username, accessToken),
    onError,
    onSuccess: () => {
      recordActivity();

      getQueryClient().setQueryData<Points>(
        getPointsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }

          return {
            ...data,
            points: (
              parseFloat(data.points) + parseFloat(data.uPoints)
            ).toFixed(3),
            uPoints: "0",
          };
        }
      );

      onSuccess?.();
    },
  });
}
