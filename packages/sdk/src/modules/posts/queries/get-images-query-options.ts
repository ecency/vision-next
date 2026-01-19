import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch, WrappedResponse } from "@/modules/core";
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

export function getImagesInfiniteQueryOptions(
  username: string | undefined,
  code?: string,
  limit: number = 10
) {
  return infiniteQueryOptions({
    queryKey: ["posts", "images", "infinite", username, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!username || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false,
          },
        };
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/images?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      return response.json() as Promise<WrappedResponse<UserImage>>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    enabled: !!username && !!code,
  });
}
