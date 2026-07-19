import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";
import { WrappedResponse } from "@/modules/core/types";

export function useRemoveFragment(
  username: string,
  code: string | undefined
) {
  return useMutation({
    mutationKey: ["posts", "remove-fragment", username],
    mutationFn: async ({ fragmentId }: { fragmentId: string }) => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();

      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/fragments-delete", {
        method: "POST",
        body: JSON.stringify({
          code,
          id: fragmentId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // getBoundFetch returns the raw fetch, so a 401/403/500 resolves rather than
      // rejects. Without this guard onSuccess would run and strip the fragment from
      // cache on a failed delete (false success). Throw so onError fires instead.
      if (!response.ok) {
        throw new Error(`[SDK][Posts] Failed to delete fragment: ${response.status}`);
      }

      return response;
    },
    onSuccess(_data, variables) {
      const queryClient = getQueryClient();

      // Update regular query cache
      queryClient.setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [...(data ?? [])].filter(({ id }) => id !== variables.fragmentId)
      );

      // Update infinite query cache - remove fragment from all pages
      queryClient.setQueriesData<InfiniteData<WrappedResponse<Fragment>>>(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((fragment) => fragment.id !== variables.fragmentId),
            })),
          };
        }
      );
    },
  });
}
