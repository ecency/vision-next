import { CONFIG, INTERNAL_API_TIMEOUT_MS, getBoundFetch, withTimeoutSignal } from "@/modules/core";
import { SearchResponse } from "./types/search-response";

type RequestError = Error & { status?: number; data?: unknown };

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const parseBody = async (): Promise<unknown> => {
    try {
      return await response.json();
    } catch {
      try {
        return await response.text();
      } catch {
        return undefined;
      }
    }
  };

  const data = await parseBody();
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`) as RequestError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (data === undefined) {
    throw new Error("Response body was empty or invalid JSON");
  }

  return data as T;
}

export async function search(
  q: string,
  sort: string,
  hideLow: string,
  since?: string,
  scroll_id?: string,
  votes?: number,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const data: {
    q: string;
    sort: string;
    hide_low: string;
    since?: string;
    scroll_id?: string;
    votes?: number;
  } = { q, sort, hide_low: hideLow };

  if (since) {
    data.since = since;
  }
  if (scroll_id) {
    data.scroll_id = scroll_id;
  }
  if (votes) {
    data.votes = votes;
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal: withTimeoutSignal(INTERNAL_API_TIMEOUT_MS, signal),
  });

  return parseJsonResponse<SearchResponse>(response);
}

export async function searchPath(q: string, signal?: AbortSignal): Promise<string[]> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q }),
    signal: withTimeoutSignal(INTERNAL_API_TIMEOUT_MS, signal),
  });

  const data = await parseJsonResponse<string[]>(response);
  return data?.length > 0 ? data : [q];
}
