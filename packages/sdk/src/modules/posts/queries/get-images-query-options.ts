import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getAccessToken } from "@/modules/core";
import { UserImage } from "../types/user-image";

async function fetchUserImages(username: string): Promise<UserImage[]> {
  const response = await fetch(CONFIG.privateApiHost + "/private-api/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: getAccessToken(username),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch images: ${response.status}`);
  }

  return response.json() as Promise<UserImage[]>;
}

export function getImagesQueryOptions(username?: string) {
  return queryOptions({
    queryKey: ["posts", "images", username],
    queryFn: async () => {
      if (!username) {
        return [];
      }
      return fetchUserImages(username);
    },
    enabled: !!username,
  });
}

export function getGalleryImagesQueryOptions(activeUsername: string | undefined) {
  return queryOptions({
    queryKey: ["posts", "gallery-images", activeUsername],
    queryFn: async () => {
      if (!activeUsername) {
        return [];
      }
      return fetchUserImages(activeUsername);
    },
    enabled: !!activeUsername,
  });
}
