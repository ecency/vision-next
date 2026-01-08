import { CONFIG, getBoundFetch } from "@/modules/core";

export async function getSpkWallet<T = Record<string, unknown>>(
  username: string
): Promise<T> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(`${CONFIG.spkNode}/@${username}`);

  if (!response.ok) {
    throw new Error(`[SDK][SPK] – wallet failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getSpkMarkets<T = Record<string, unknown>>(): Promise<T> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(`${CONFIG.spkNode}/markets`);

  if (!response.ok) {
    throw new Error(`[SDK][SPK] – markets failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
