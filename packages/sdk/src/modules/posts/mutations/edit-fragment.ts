import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";
import { applyFragmentUpdate } from "../utils/fragment-cache-helpers";
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
      // Raw fetch resolves on 4xx/5xx, so a JSON error response would otherwise run
      // onSuccess and overwrite the cached fragment with bogus data. Throw instead.
      if (!response.ok) {
        throw new Error(`[SDK][Posts] Failed to update fragment: ${response.status}`);
      }
      return response.json() as Promise<Fragment>;
    },
    onSuccess(response, variables) {
      const queryClient = getQueryClient();

      // The /fragments-update endpoint returns a minimal acknowledgement, not the
      // full fragment, so writing the raw response into the cache blanked out the
      // edited snippet. Rebuild the fragment from the submitted values instead.
      const applyUpdate = (fragment: Fragment): Fragment =>
        applyFragmentUpdate(fragment, response, variables);

      // Update regular query cache
      queryClient.setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) =>
          data?.map((fragment) =>
            fragment.id === variables.fragmentId ? applyUpdate(fragment) : fragment
          ) ?? []
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
                fragment.id === variables.fragmentId ? applyUpdate(fragment) : fragment
              ),
            })),
          };
        }
      );
    },
  });
}
