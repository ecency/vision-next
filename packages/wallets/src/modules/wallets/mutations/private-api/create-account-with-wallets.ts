import { CONFIG } from "@ecency/sdk";
import { useHiveKeysQuery, useWalletsCacheQuery } from "@/modules/wallets/queries";
import { getBoundFetch } from "@/modules/wallets/utils";
import { useMutation } from "@tanstack/react-query";

interface Payload {
  currency: string;
  address: string;
}

export function useCreateAccountWithWallets(username: string) {
  const { data } = useWalletsCacheQuery(username);
  const { data: hiveKeys } = useHiveKeysQuery(username);

  const fetchApi = getBoundFetch();

  return useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: ({ currency, address }: Payload) =>
      fetchApi(CONFIG.privateApiHost + "/private-api/wallets-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          token: currency,
          address,
          meta: {
            ownerPublicKey: hiveKeys?.ownerPubkey,
            activePublicKey: hiveKeys?.activePubkey,
            postingPublicKey: hiveKeys?.postingPubkey,
            memoPublicKey: hiveKeys?.memoPubkey,

            ...Array.from(data?.entries() ?? []).reduce(
              (acc, [curr, info]) => ({
                ...acc,
                [curr]: info.address,
              }),
              {}
            ),
          },
        }),
      }),
  });
}
