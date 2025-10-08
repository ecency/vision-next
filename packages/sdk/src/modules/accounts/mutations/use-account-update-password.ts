import { PrivateKey } from "@hiveio/dhive";
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import { useAccountUpdateKeyAuths } from "./use-account-update-key-auths";

interface Payload {
  newPassword: string;
  currentPassword: string;
  keepCurrent?: boolean;
}

/**
 * Only native Hive and custom passwords could be updated here
 * Seed based password cannot be updated here, it will be in an account always for now
 */
type UpdatePasswordOptions = Pick<
  UseMutationOptions<unknown, Error, Payload>,
  "onSuccess" | "onError"
>;

export function useAccountUpdatePassword(
  username: string,
  options?: UpdatePasswordOptions
) {
  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));

  const { mutateAsync: updateKeys } = useAccountUpdateKeyAuths(username);

  return useMutation({
    mutationKey: ["accounts", "password-update", username],
    mutationFn: async ({
      newPassword,
      currentPassword,
      keepCurrent,
    }: Payload) => {
      if (!accountData) {
        throw new Error(
          "[SDK][Update password] – cannot update password for anon user"
        );
      }
      const currentKey = PrivateKey.fromLogin(
        username,
        currentPassword,
        "owner"
      );

      return updateKeys({
        currentKey,
        keepCurrent,
        keys: [
          {
            owner: PrivateKey.fromLogin(username, newPassword, "owner"),
            active: PrivateKey.fromLogin(username, newPassword, "active"),
            posting: PrivateKey.fromLogin(username, newPassword, "posting"),
            memo_key: PrivateKey.fromLogin(username, newPassword, "memo"),
          },
        ],
      });
    },
    ...options,
  });
}
