import { CONFIG, getBoundFetch } from "@/modules/core";
import { AccountSearchResult } from "./types/account-search-result";
import { SearchResponse } from "./types/search-response";
import { TagSearchResult } from "./types/tag-search-result";

type RequestError = Error & { status?: number; data?: unknown };

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`) as RequestError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function search(
  q: string,
  sort: string,
  hideLow: string,
  since?: string,
  scroll_id?: string,
  votes?: number
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
  });

  return parseJsonResponse<SearchResponse>(response);
}

export async function searchAccount(
  q: string = "",
  limit: number = 20,
  random: number = 1
): Promise<AccountSearchResult[]> {
  const data = { q, limit, random };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<AccountSearchResult[]>(response);
}

export async function searchTag(
  q: string = "",
  limit: number = 20,
  random: number = 0
): Promise<TagSearchResult[]> {
  const data = { q, limit, random };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-tag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<TagSearchResult[]>(response);
}

export async function searchPath(q: string): Promise<string[]> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/search-api/search-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q }),
  });

  const data = await parseJsonResponse<string[]>(response);
  return data?.length > 0 ? data : [q];
}
