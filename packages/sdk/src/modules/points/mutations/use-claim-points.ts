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

  // Media types are case-insensitive; normalise once and reuse in every branch.
  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const body = await response.text();

  if (!response.ok) {
    if (response.status === 406) {
      try {
        return JSON.parse(body);
      } catch {
        return { message: body, code: response.status };
      }
    }
    // Only fold a short JSON error body into the message; an HTML gateway page
    // (e.g. 502/503) would otherwise fragment the Sentry group per distinct
    // page — the same problem the non-JSON guard below avoids for a 2xx body.
    const detail =
      body && contentType.includes("json") ? `: ${body.slice(0, 200)}` : "";
    throw new Error(
      `[SDK][Points][Claim] – failed with status ${response.status}${detail}`
    );
  }

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
