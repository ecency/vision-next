import { CONFIG } from "@/modules/core";
import { PrivateKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import * as R from "remeda";
import { FullAccount } from "../types";
import hs from "hivesigner";
import type { AuthContext } from "@/modules/core/types";

type SignType = "key" | "keychain" | "hivesigner";

interface CommonPayload {
  accountName: string;
  type: SignType;
  key?: PrivateKey;
}

type RevokePostingOptions = Pick<
  UseMutationOptions<unknown, Error, CommonPayload>,
  "onSuccess" | "onError"
>;

export function useAccountRevokePosting(
  username: string | undefined,
  options: RevokePostingOptions,
  auth?: AuthContext
) {
  const queryClient = useQueryClient();

  const { data } = useQuery(getAccountFullQueryOptions(username));

  return useMutation({
    mutationKey: ["accounts", "revoke-posting", data?.name],
    mutationFn: async ({ accountName, type, key }: CommonPayload) => {
      if (!data) {
        throw new Error(
          "[SDK][Accounts] – cannot revoke posting for anonymous user"
        );
      }

      const posting = R.pipe(
        {},
        R.mergeDeep(data.posting)
      ) as FullAccount["posting"];

      posting.account_auths = posting.account_auths.filter(
        ([account]) => account !== accountName
      );

      const operationBody = {
        account: data.name,
        posting,
        memo_key: data.memo_key,
        json_metadata: data.json_metadata,
      };

      if (type === "key" && key) {
        return CONFIG.hiveClient.broadcast.updateAccount(operationBody, key);
      } else if (type === "keychain") {
        if (!auth?.broadcast) {
          throw new Error("[SDK][Accounts] – missing keychain broadcaster");
        }
        return auth.broadcast(
          [["account_update", operationBody]],
          auth,
          "Active"
        );
      } else {
        const params = {
          callback: `https://ecency.com/@${data.name}/permissions`,
        };
        return hs.sendOperation(
          ["account_update", operationBody],
          params,
          () => {}
        );
      }
    },
    onError: options.onError,
    onSuccess: (resp, payload, ctx) => {
      (options.onSuccess as
        | ((data: unknown, variables: CommonPayload, context: unknown) => unknown)
        | undefined)?.(resp, payload, ctx);
      queryClient.setQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey,
        (data) =>
          ({
            ...data,
            posting: {
              ...data?.posting,
              account_auths:
                data?.posting?.account_auths?.filter(
                  ([account]) => account !== payload.accountName
                ) ?? [],
            },
          }) as FullAccount
      );
    },
  });
}
