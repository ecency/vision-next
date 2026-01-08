import { CONFIG, getBoundFetch } from "@/modules/core";
import { PrivateKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import hs from "hivesigner";
import { getAccountFullQueryOptions } from "../queries";
import type { AuthContext } from "@/modules/core/types";

type SignType = "key" | "keychain" | "hivesigner" | "ecency";

interface CommonPayload {
  accountName: string;
  type: SignType;
  key?: PrivateKey;
  email?: string;
}

type UpdateRecoveryOptions = Pick<
  UseMutationOptions<unknown, Error, CommonPayload>,
  "onSuccess" | "onError"
>;

export function useAccountUpdateRecovery(
  username: string | undefined,
  code: string | undefined,
  options: UpdateRecoveryOptions,
  auth?: AuthContext
) {
  const { data } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "recovery", data?.name],
    mutationFn: async ({ accountName, type, key, email }: CommonPayload) => {
      if (!data) {
        throw new Error(
          "[SDK][Accounts] – cannot change recovery for anonymous user"
        );
      }

      const operationBody = {
        account_to_recover: data.name,
        new_recovery_account: accountName,
        extensions: [],
      };

      if (type === "ecency") {
        if (!code) {
          throw new Error("[SDK][Accounts] – missing access token");
        }
        const fetchApi = getBoundFetch();

        return fetchApi(CONFIG.privateApiHost + "/private-api/recoveries-add", {
          method: "POST",
          body: JSON.stringify({
            code,
            email,
            publicKeys: [
              ...data.owner.key_auths,
              ...data.active.key_auths,
              ...data.posting.key_auths,
              data.memo_key,
            ],
          }),
        });
      } else if (type === "key" && key) {
        return CONFIG.hiveClient.broadcast.sendOperations(
          [["change_recovery_account", operationBody]],
          key
        );
      } else if (type === "keychain") {
        if (!auth?.broadcast) {
          throw new Error("[SDK][Accounts] – missing keychain broadcaster");
        }
        return auth.broadcast([["change_recovery_account", operationBody]], "active");
      } else {
        const params = {
          callback: `https://ecency.com/@${data.name}/permissions`,
        };
        return hs.sendOperation(
          ["change_recovery_account", operationBody],
          params,
          () => {}
        );
      }
    },
    onError: options.onError,
    onSuccess: options.onSuccess,
  });
}
