import { useMutation } from "@tanstack/react-query";
import { useLoginInApp } from "./use-login-in-app";
import { getAccountFullQuery } from "@/api/queries";
import { EcencyConfigManager } from "@/config";
import { addAccountAuthority, makeHsCode, signBuffer } from "@/utils";
import i18next from "i18next";
import { error } from "../../feedback";
import { formatError } from "@/api/operations";

export function useLoginByKeychain(username: string) {
  const loginInApp = useLoginInApp(username);

  const { data: account } = getAccountFullQuery(username).useClientQuery();

  return useMutation({
    mutationKey: ["login-by-keychain", username, account],
    mutationFn: async () => {
      if (!account) {
        throw new Error("Account has not found");
      }

      const hasPostingPerm =
        account.posting!.account_auths.filter(
          (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
        ).length > 0;

      if (!hasPostingPerm) {
        const weight = account.posting!.weight_threshold;

        try {
          await addAccountAuthority(
            username,
            EcencyConfigManager.CONFIG.service.hsClientId,
            "Posting",
            weight
          );
        } catch (err) {
          throw new Error(i18next.t("login.error-permission"));
        }
      }

      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        username,
        (message) => signBuffer(username, message, "Posting").then((r) => r.result)
      );

      await loginInApp(code, null, account!);
    },
    onError: (e) => error(...formatError(e))
  });
}
