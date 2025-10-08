import { CONFIG, getAccessToken, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "../types";
import { getFragmentsQueryOptions } from "../queries";

export function useEditFragment(username: string, fragmentId: string) {
  return useMutation({
    mutationKey: ["posts", "edit-fragment", username, fragmentId],
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/fragments-update",
        {
          method: "POST",
          body: JSON.stringify({
            code: getAccessToken(username),
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
    onSuccess(response) {
      getQueryClient().setQueryData<Fragment[]>(
        getFragmentsQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return [];
          }

          const index = data.findIndex(({ id }) => id === fragmentId);
          if (index >= 0) {
            data[index] = response;
          }

          return [...data];
        }
      );
    },
  });
}
