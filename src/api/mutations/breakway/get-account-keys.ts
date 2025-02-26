import { appAxios } from "@/api/axios";
import { error } from "@/features/shared";
import { useMutation } from "@tanstack/react-query";

interface ResponseData {
  accountDetails: {
    username: string;
    owner: string;
    active: string;
    posting: string;
    memo: string;
    masterPassword: string;
    ownerPubkey: string;
    activePubkey: string;
    postingPubkey: string;
    memoPubkey: string;
  };
}

/**
 * Generate and return keys for new account with given username
 */
export function useGetBreakwayAccountKeys(username: string) {
  return useMutation({
    mutationKey: ["breakway", "get-account-keys", username],
    mutationFn: async () => {
      const response = await appAxios.post<ResponseData>(
        "https://api.breakaway.community/get-account-keys",
        {
          username
        }
      );

      return response.data.accountDetails;
    },
    onError: (e) => error(e.message)
  });
}
