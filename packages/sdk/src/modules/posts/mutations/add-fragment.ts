import {
  CONFIG,
  getAccessToken,
  getBoundFetch,
  getQueryClient,
} from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";

export function useAddFragment(username: string) {
  return useMutation({
    mutationKey: ["posts", "add-fragment", username],
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments-add",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username),
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
      getQueryClient().setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username).queryKey,
        (data) => [response, ...(data ?? [])]
      );
    },
  });
}
