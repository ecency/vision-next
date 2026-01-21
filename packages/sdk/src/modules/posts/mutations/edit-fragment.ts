import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";

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
      getQueryClient().setQueryData<Fragment[]>(
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
    },
  });
}
