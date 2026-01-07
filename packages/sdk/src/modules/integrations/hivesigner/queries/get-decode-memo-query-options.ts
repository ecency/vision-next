import { queryOptions } from "@tanstack/react-query";
import hs from "hivesigner";

export function getDecodeMemoQueryOptions(
  username: string,
  memo: string,
  accessToken: string | undefined
) {
  return queryOptions({
    queryKey: ["integrations", "hivesigner", "decode-memo", username],
    queryFn: async () => {
      if (accessToken) {
        const hsClient = new hs.Client({
          accessToken,
        });
        return hsClient.decode(memo);
      }
    },
  });
}
