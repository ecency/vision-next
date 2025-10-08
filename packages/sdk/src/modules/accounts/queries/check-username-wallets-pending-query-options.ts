import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function checkUsernameWalletsPendingQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["accounts", "check-wallet-pending", username],
    queryFn: async () => {
      const response = await fetch(
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
