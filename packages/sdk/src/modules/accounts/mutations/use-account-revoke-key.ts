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
  /** Keys to revoke. Accepts a single key or an array. */
  revokingKey: PublicKey | PublicKey[];
}

/**
 * Revoke one or more keys from an account on the Hive blockchain.
 *
 * When revoking keys that exist only in active/posting authorities,
 * the owner field is omitted from the operation so active-level
 * signing is sufficient.
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
          "[SDK][Revoke key] – cannot update keys for anon user"
        );
      }

      const revokingKeys = Array.isArray(revokingKey) ? revokingKey : [revokingKey];
      const revokingKeyStrs = new Set(revokingKeys.map((k) => k.toString()));

      const hasAnyKeyInAuth = (keyName: keyof Keys) =>
        accountData[keyName].key_auths.some(
          ([key]: [string | PublicKey, number]) => revokingKeyStrs.has(String(key))
        );

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = JSON.parse(JSON.stringify(accountData[keyName]));

        auth.key_auths = auth.key_auths.filter(
          ([key]) => !revokingKeyStrs.has(key.toString())
        );

        return auth;
      };

      // Only include owner in the update if a revoking key is actually
      // in the owner authority. Including owner forces owner-level signing
      // even when removing a key that only exists in active/posting.
      const needsOwnerUpdate = hasAnyKeyInAuth("owner");

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
