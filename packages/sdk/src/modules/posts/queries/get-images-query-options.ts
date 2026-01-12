import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";
import { UserImage } from "../types/user-image";

async function fetchUserImages(code: string | undefined): Promise<UserImage[]> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch images: ${response.status}`);
  }

  return response.json() as Promise<UserImage[]>;
}

export function getImagesQueryOptions(username?: string, code?: string) {
  return queryOptions({
    queryKey: ["posts", "images", username],
    queryFn: async () => {
      if (!username || !code) {
        return [];
      }
      return fetchUserImages(code);
    },
    enabled: !!username && !!code,
  });
}

export function getGalleryImagesQueryOptions(activeUsername: string | undefined, code?: string) {
  return queryOptions({
    queryKey: ["posts", "gallery-images", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }
      return fetchUserImages(code);
    },
    enabled: !!activeUsername && !!code,
  });
}
