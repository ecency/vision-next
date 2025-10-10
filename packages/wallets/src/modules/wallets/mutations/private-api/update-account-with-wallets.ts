import { CONFIG, getAccessToken } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";

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
  return useMutation({
    mutationKey: ["ecency-wallets", "create-account-with-wallets", username],
    mutationFn: ({ tokens, hiveKeys }: Payload) =>
      fetch(CONFIG.privateApiHost + "/private-api/wallets-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          code: getAccessToken(username),
          token: "BTC",
          address: tokens.BTC,
          status: 3,
          meta: {
            ...tokens,
            ownerPublicKey: hiveKeys.ownerPublicKey,
            activePublicKey: hiveKeys.activePublicKey,
            postingPublicKey: hiveKeys.postingPublicKey,
            memoPublicKey: hiveKeys.memoPublicKey,
          },
        }),
      }),
  });
}
