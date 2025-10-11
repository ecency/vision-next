import { CONFIG, getAccessToken } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { getBoundFetch } from "@/modules/wallets/utils";

interface Payload {
  tokens: Record<string, string>;
  hiveKeys: {
    ownerPublicKey: string;
    activePublicKey: string;
    postingPublicKey: string;
    memoPublicKey: string;
  };
}

export function useUpdateAccountWithWallets(username: string) {
  const fetchApi = getBoundFetch();

  return useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: async ({ tokens, hiveKeys }: Payload) => {
      const entries = Object.entries(tokens).filter(([, address]) => Boolean(address));

      if (entries.length === 0) {
        return new Response(null, { status: 204 });
      }

      const [primaryToken, primaryAddress] = entries[0] ?? ["", ""];

      return fetchApi(CONFIG.privateApiHost + "/private-api/wallets-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          code: getAccessToken(username),
          token: primaryToken,
          address: primaryAddress,
          status: 3,
          meta: {
            ...Object.fromEntries(entries),
            ownerPublicKey: hiveKeys.ownerPublicKey,
            activePublicKey: hiveKeys.activePublicKey,
            postingPublicKey: hiveKeys.postingPublicKey,
            memoPublicKey: hiveKeys.memoPublicKey,
          },
        }),
      });
    },
  });
}
