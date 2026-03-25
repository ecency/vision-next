import { PrivateKey, PublicKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import { CONFIG } from "@/modules/core";
import { buildRevokeKeysOp } from "./build-revoke-keys-op";

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
      const op = buildRevokeKeysOp(accountData, revokingKeys);

      return CONFIG.hiveClient.broadcast.updateAccount(op, currentKey);
    },
    ...options,
  });
}
