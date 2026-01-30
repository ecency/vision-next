import { CONFIG } from "@/modules/core";
import { AuthorityType, PrivateKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import * as R from "remeda";
import { getAccountFullQueryOptions } from "../queries";

export interface Keys {
  owner: PrivateKey;
  active: PrivateKey;
  posting: PrivateKey;
  memo_key: PrivateKey;
}

interface Payload {
  keepCurrent?: boolean;
  currentKey: PrivateKey;
  keys: Keys[];
  keysToRevoke?: string[];
}

export function dedupeAndSortKeyAuths(
  existing: AuthorityType["key_auths"],
  additions: [string, number][]
): AuthorityType["key_auths"] {
  const merged = new Map<string, number>();

  existing.forEach(([key, weight]) => {
    merged.set(key.toString(), weight);
  });

  additions.forEach(([key, weight]) => {
    merged.set(key.toString(), weight);
  });

  return Array.from(merged.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, weight]) => [key, weight] as [string, number]);
}

type UpdateKeyAuthsOptions = Pick<
  UseMutationOptions<unknown, Error, Payload>,
  "onSuccess" | "onError"
>;

export function useAccountUpdateKeyAuths(
  username: string,
  options?: UpdateKeyAuthsOptions
) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "keys-update", username],
    mutationFn: async ({ keys, keepCurrent = false, currentKey, keysToRevoke = [] }: Payload) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] – cannot update keys for anon user"
        );
      }

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = R.clone(accountData[keyName]);

        // Filter out keys to revoke from existing keys
        const existingKeys = keepCurrent
          ? auth.key_auths.filter(([key]) => !keysToRevoke.includes(key.toString()))
          : [];

        auth.key_auths = dedupeAndSortKeyAuths(
          existingKeys,
          keys.map(
            (values, i) =>
              [values[keyName].createPublic().toString(), i + 1] as [
                string,
                number,
              ]
          )
        );

        return auth;
      };

      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: username,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          // Always use new memo key when adding new keys
          memo_key: keys[0].memo_key.createPublic().toString(),
        },
        currentKey
      );
    },
    ...options,
  });
}
