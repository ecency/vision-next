import { CONFIG } from "@/modules/core";
import { PrivateKey } from "@hiveio/dhive";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import * as R from "remeda";
import { FullAccount } from "../types";
import { Keychain } from "@/modules/keychain";
import hs from "hivesigner";

type SignType = "key" | "keychain" | "hivesigner";

interface CommonPayload {
  accountName: string;
  type: SignType;
  key?: PrivateKey;
}

export function useAccountRevokePosting(
  username: string | undefined,
  options: Pick<Parameters<typeof useMutation>[0], "onSuccess" | "onError">
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
        return Keychain.broadcast(
          data.name,
          [["account_update", operationBody]],
          "Active"
        ) as Promise<any>;
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
      options.onSuccess?.(resp, payload, ctx);
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
