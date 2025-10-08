import { CONFIG } from "@/modules/core";
import { AuthorityType, PrivateKey } from "@hiveio/dhive";
import { useMutation, useQuery } from "@tanstack/react-query";
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
}

export function dedupeAndSortKeyAuths(
  existing: AuthorityType["key_auths"],
  additions: [string, number][]
) {
  const map = R.fromEntries(
    existing.map(([key, weight]) => [key.toString(), weight])
  );
  return R.pipe(
    map,
    R.merge(R.fromEntries(additions)),
    R.entries(),
    R.sortBy(([key]) => key)
  );
}

export function useAccountUpdateKeyAuths(
  username: string,
  options?: Pick<Parameters<typeof useMutation>[0], "onSuccess" | "onError">
) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "keys-update", username],
    mutationFn: async ({ keys, keepCurrent = false, currentKey }: Payload) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] – cannot update keys for anon user"
        );
      }

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = R.clone(accountData[keyName]);

        auth.key_auths = dedupeAndSortKeyAuths(
          keepCurrent ? auth.key_auths : [],
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
          memo_key: keepCurrent
            ? accountData.memo_key
            : keys[0].memo_key.createPublic().toString(),
        },
        currentKey
      );
    },
    ...options,
  });
}
