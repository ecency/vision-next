import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function checkUsernameWalletsPendingQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["accounts", "check-wallet-pending", username],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/wallets-chkuser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
          }),
        }
      );
      return (await response.json()) as { exist: boolean };
    },
    enabled: !!username,
    refetchOnMount: true,
  });
}
