import { AuthorityType, PrivateKey, PublicKey } from "@hiveio/dhive";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import * as R from "remeda";
import { CONFIG } from "@/modules/core";
import { Keys } from "./use-account-update-key-auths";

interface Payload {
  currentKey: PrivateKey;
  revokingKey: PublicKey;
}

/**
 * This hook provides functionality to revoke a key from an account on the Hive blockchain.
 * It leverages React Query's `useMutation` for managing the mutation state and executing
 * the operation efficiently.
 *
 * @param username The username of the Hive account from which the key should be revoked.
 *                 Pass `undefined` if the username is unknown or not set yet.
 *
 * @returns The mutation object from `useMutation`, including methods to trigger the key
 *          revocation and access its state (e.g., loading, success, error).
 */
export function useAccountRevokeKey(
  username: string | undefined,
  options?: Pick<Parameters<typeof useMutation>[0], "onSuccess" | "onError">
) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "revoke-key", accountData?.name],
    mutationFn: async ({ currentKey, revokingKey }: Payload) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] – cannot update keys for anon user"
        );
      }

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = R.clone(accountData[keyName]);

        auth.key_auths = auth.key_auths.filter(
          ([key]) => key !== revokingKey.toString()
        );

        return auth;
      };

      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: accountData.name,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          memo_key: accountData.memo_key,
        },
        currentKey
      );
    },
    ...options,
  });
}
