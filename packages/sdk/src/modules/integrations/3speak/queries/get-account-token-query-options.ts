import { queryOptions } from "@tanstack/react-query";
import { HiveSignerIntegration } from "../../hivesigner";
import { getQueryClient } from "@/modules/core";

export function getAccountTokenQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["integrations", "3speak", "authenticate", username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Integrations][3Speak] – anon user");
      }

      const response = await fetch(
        `https://studio.3speak.tv/mobile/login?username=${username}&hivesigner=true`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const memoQueryOptions =
        HiveSignerIntegration.queries.getDecodeMemoQueryOptions(
          username,
          (await response.json()).memo
        );
      await getQueryClient().prefetchQuery(memoQueryOptions);
      const { memoDecoded } = getQueryClient().getQueryData(
        memoQueryOptions.queryKey
      );

      return memoDecoded.replace("#", "");
    },
  });
}
