import { CONFIG, getAccessToken, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";

export function useRemoveFragment(username: string, fragmentId: string) {
  return useMutation({
    mutationKey: ["posts", "remove-fragment", username],
    mutationFn: async () =>
      fetch(CONFIG.privateApiHost + "/private-api/fragments-delete", {
        method: "POST",
        body: JSON.stringify({
          code: getAccessToken(username),
          id: fragmentId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onSuccess() {
      getQueryClient().setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username).queryKey,
        (data) => [...(data ?? [])].filter(({ id }) => id !== fragmentId)
      );
    },
  });
}
