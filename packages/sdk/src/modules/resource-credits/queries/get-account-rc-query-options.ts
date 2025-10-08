import { CONFIG } from "@/modules/core";
import { RCAPI } from "@hiveio/dhive";
import { queryOptions } from "@tanstack/react-query";

export function getAccountRcQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["resource-credits", "account", username],
    queryFn: async () => {
      const rcClient = new RCAPI(CONFIG.hiveClient);
      return rcClient.findRCAccounts([username]);
    },
    enabled: !!username,
  });
}
