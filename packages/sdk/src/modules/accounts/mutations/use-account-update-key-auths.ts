import { PrivateKey } from "../../../hive-tx";
import type { Authority } from "../../../hive-tx";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import { broadcastOperations } from "@/modules/core/hive-tx";

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
  keysToRevoke?: string[]; // Deprecated: will be treated as revoking from all authorities
  keysToRevokeByAuthority?: Partial<Record<keyof Keys, string[]>>; // Authority-specific revocation
}

export function dedupeAndSortKeyAuths(
  existing: Authority["key_auths"],
  additions: [string, number][]
): Authority["key_auths"] {
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
    mutationFn: async ({
      keys,
      keepCurrent = false,
      currentKey,
      keysToRevoke = [],
      keysToRevokeByAuthority = {}
    }: Payload) => {
      if (keys.length === 0) {
        throw new Error(
          "[SDK][Update password] – no new keys provided"
        );
      }

      if (!accountData) {
        throw new Error(
          "[SDK][Update password] – cannot update keys for anon user"
        );
      }

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: Authority = JSON.parse(JSON.stringify(accountData[keyName]));

        // Get keys to revoke for this specific authority
        const keysToRevokeForAuthority = keysToRevokeByAuthority[keyName] || [];
        // Fallback to global keysToRevoke for backwards compatibility
        const allKeysToRevoke = [
          ...keysToRevokeForAuthority,
          ...(keysToRevokeByAuthority[keyName] === undefined ? keysToRevoke : [])
        ];

        // Filter out keys to revoke from existing keys (authority-specific)
        const existingKeys = keepCurrent
          ? auth.key_auths.filter(([key]) => !allKeysToRevoke.includes(key.toString()))
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

      return broadcastOperations(
        [["account_update", {
          account: username,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          // Always use new memo key when adding new keys
          memo_key: keys[0].memo_key.createPublic().toString(),
        }]],
        currentKey
      );
    },
    ...options,
  });
}
