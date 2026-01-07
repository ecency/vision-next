import { CONFIG, getBoundFetch } from "@/modules/core";
import { HsTokenRenewResponse } from "./types";

type RequestError = Error & { status?: number; data?: unknown };

export async function hsTokenRenew(code: string): Promise<HsTokenRenewResponse> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/auth-api/hs-token-refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const data = (await response.json()) as HsTokenRenewResponse;
  if (!response.ok) {
    const error = new Error(`Failed to refresh token: ${response.status}`) as RequestError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
