import { AuthorityType, PrivateKey, PublicKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
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
type RevokeKeyOptions = Pick<
  UseMutationOptions<unknown, Error, Payload>,
  "onSuccess" | "onError"
>;

export function useAccountRevokeKey(
  username: string | undefined,
  options?: RevokeKeyOptions
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

      const revokingKeyStr = revokingKey.toString();

      const hasKeyInAuth = (keyName: keyof Keys) =>
        accountData[keyName].key_auths.some(
          ([key]: [string | PublicKey, number]) => String(key) === revokingKeyStr
        );

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = JSON.parse(JSON.stringify(accountData[keyName]));

        auth.key_auths = auth.key_auths.filter(
          ([key]) => key !== revokingKeyStr
        );

        return auth;
      };

      // Only include owner in the update if the revoking key is actually
      // in the owner authority. Including owner forces owner-level signing
      // even when removing a key that only exists in active/posting.
      const needsOwnerUpdate = hasKeyInAuth("owner");

      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: accountData.name,
          json_metadata: accountData.json_metadata,
          owner: needsOwnerUpdate ? prepareAuth("owner") : undefined,
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
