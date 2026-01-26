import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";
import { WrappedResponse } from "@/modules/core/types";

export function useAddFragment(username: string, code: string | undefined) {
  return useMutation({
    mutationKey: ["posts", "add-fragment", username],
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-add",
        {
          method: "POST",
          body: JSON.stringify({
            code,
            title,
            body,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.json() as Promise<Fragment>;
    },
    onSuccess(response) {
      const queryClient = getQueryClient();

      // Update regular query cache
      queryClient.setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [response, ...(data ?? [])]
      );

      // Update infinite query cache - add new fragment to first page
      queryClient.setQueriesData<InfiniteData<WrappedResponse<Fragment>>>(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page, index) =>
              index === 0
                ? { ...page, data: [response, ...page.data] }
                : page
            ),
          };
        }
      );
    },
  });
}
