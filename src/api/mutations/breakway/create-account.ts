import { appAxios } from "@/api/axios";
import { error } from "@/features/shared";
import { useMutation } from "@tanstack/react-query";

interface Payload {
  accountKeys: Record<string, string>;
}

export function useCreateAccount(username: string, address: string) {
  return useMutation({
    mutationKey: ["breakway", "create-account", username, address],
    mutationFn: async ({ accountKeys }: Payload) => {
      const response = await appAxios.post("https://api.breakaway.community/create-account", {
        username,
        address,
        ordinalAddress: "",
        message: "",
        signature: "",
        accountKeys
      });
      return response.data;
    },
    onError: (e) => error(e.message)
  });
}
