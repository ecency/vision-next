import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";

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

      return fetchApi(CONFIG.privateApiHost + "/private-api/fragments-delete", {
        method: "POST",
        body: JSON.stringify({
          code,
          id: fragmentId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess(_data, variables) {
      getQueryClient().setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username, code).queryKey,
        (data) => [...(data ?? [])].filter(({ id }) => id !== variables.fragmentId)
      );
    },
  });
}
