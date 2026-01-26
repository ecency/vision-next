import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";
import { WrappedResponse } from "@/modules/core/types";

export function useEditFragment(
  username: string,
  code: string | undefined
) {
  return useMutation({
    mutationKey: ["posts", "edit-fragment", username],
    mutationFn: async ({
      fragmentId,
      title,
      body
    }: {
      fragmentId: string;
      title: string;
      body: string;
    }) => {
      if (!code) {
        throw new Error("[SDK][Posts] Missing access token");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-update",
        {
          method: "POST",
          body: JSON.stringify({
            code,
            id: fragmentId,
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
    onSuccess(response, variables) {
      const queryClient = getQueryClient();

      // Update regular query cache
      queryClient.setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => {
          if (!data) {
            return [];
          }

          const index = data.findIndex(({ id }) => id === variables.fragmentId);
          if (index >= 0) {
            data[index] = response;
          }

          return [...data];
        }
      );

      // Update infinite query cache - update fragment in all pages
      queryClient.setQueriesData<InfiniteData<WrappedResponse<Fragment>>>(
        { queryKey: ["posts", "fragments", "infinite", username] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((fragment) =>
                fragment.id === variables.fragmentId ? response : fragment
              ),
            })),
          };
        }
      );
    },
  });
}
