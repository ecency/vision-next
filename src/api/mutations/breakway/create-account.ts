import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { error } from "@/features/shared";
import { useMutation } from "@tanstack/react-query";

interface Payload {
  accountKeys: Record<string, string>;
}

export function useCreateAccount(username: string, address: string) {
  return useMutation({
    mutationKey: ["private-api", "create-account", username, address],
    mutationFn: async ({ accountKeys }: Payload) => {
      const response = await appAxios.post(apiBase(`/private-api/wallets-add`), {
        username
      });
      return response.data;
    },
    onError: (e) => error(e.message)
  });
}
