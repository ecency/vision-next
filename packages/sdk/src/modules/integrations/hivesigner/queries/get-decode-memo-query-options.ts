import { getAccessToken } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import hs from "hivesigner";

export function getDecodeMemoQueryOptions(username: string, memo: string) {
  return queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
      const accessToken = getAccessToken(username);

      if (accessToken) {
        const hsClient = new hs.Client({
          accessToken,
        });
        return hsClient.decode(memo);
      }
    },
  });
}
