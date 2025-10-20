import { CONFIG, getAccountFullQueryOptions, Keys } from "@ecency/sdk";
import { deriveHiveKeys, detectHiveKeyDerivation } from "@ecency/wallets";
import { AuthorityType, PrivateKey } from "@hiveio/dhive";
import { useMutation, UseMutationOptions, useQuery } from "@tanstack/react-query";
import * as R from "remeda";

interface Payload {
  newKeys: Record<string, PrivateKey>;
  currentPassword: string;
}

type ChangePasswordOptions = Pick<
  UseMutationOptions<unknown, Error, Payload>,
  "onSuccess" | "onError"
>;

export function useAccountChangePassword(username: string, options?: ChangePasswordOptions) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "revoke-key", accountData?.name],
    mutationFn: async ({ currentPassword, newKeys }: Payload) => {
      if (!accountData) {
        throw new Error("[SDK][Update password] – cannot update keys for anon user");
      }

      const currentDerivation = await detectHiveKeyDerivation(username, currentPassword, "owner");

      let currentKeys: Record<string, string> = {};
      let currentKey: PrivateKey;

      if (currentDerivation === "bip44") {
        const keys = await deriveHiveKeys(currentPassword);
        currentKeys = {
          owner: keys.ownerPubkey,
          active: keys.activePubkey,
          posting: keys.postingPubkey,
          memo: keys.memoPubkey
        };
        currentKey = PrivateKey.fromString(keys.owner);
      } else if (currentDerivation === "master-password") {
        currentKeys = {
          owner: PrivateKey.fromLogin(username, currentPassword, "owner").createPublic().toString(),
          active: PrivateKey.fromLogin(username, currentPassword, "active")
            .createPublic()
            .toString(),
          posting: PrivateKey.fromLogin(username, currentPassword, "posting")
            .createPublic()
            .toString(),
          memo: PrivateKey.fromLogin(username, currentPassword, "memo").createPublic().toString()
        };
        currentKey = PrivateKey.fromLogin(username, currentPassword, "owner");
      } else {
        currentKeys = {
          owner: PrivateKey.fromString(currentPassword).createPublic().toString()
        };
        currentKey = PrivateKey.fromString(currentPassword);
      }

      const prepareAuth = (keyName: keyof Keys) => {
        const auth: AuthorityType = R.clone(accountData[keyName]);

        auth.key_auths.push([newKeys[keyName].createPublic().toString(), 1]);
        auth.key_auths.filter(([key]) => currentKeys[keyName] === key);

        return auth;
      };

      return CONFIG.hiveClient.broadcast.updateAccount(
        {
          account: accountData.name,
          json_metadata: accountData.json_metadata,
          owner: prepareAuth("owner"),
          active: prepareAuth("active"),
          posting: prepareAuth("posting"),
          memo_key: accountData.memo_key
        },
        currentKey
      );
    },
    ...options
  });
}
