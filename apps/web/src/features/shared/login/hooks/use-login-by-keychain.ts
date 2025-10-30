import { useMutation } from "@tanstack/react-query";
import { useLoginInApp } from "./use-login-in-app";
import { getAccountFullQuery } from "@/api/queries";
import { EcencyConfigManager } from "@/config";
import { addAccountAuthority, makeHsCode, signBuffer } from "@/utils";
import { shouldUseHiveAuth, signWithHiveAuth } from "@/utils/client";
import i18next from "i18next";
import { error } from "../../feedback";
import { formatError } from "@/api/operations";

export function useLoginByKeychain(username: string) {
  const loginInApp = useLoginInApp(username);

  const accountQuery = getAccountFullQuery(username);
  const { data: account } = accountQuery.useClientQuery();

  return useMutation({
    mutationKey: ["login-by-keychain", username, account],
    mutationFn: async () => {
      const accountData = account ?? (await accountQuery.fetchAndGet());

      if (!accountData) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      const hasPostingPerm =
        accountData.posting!.account_auths.filter(
          (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
        ).length > 0;

      /*if (!hasPostingPerm) {
        const weight = accountData.posting!.weight_threshold;

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
      }*/

      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        username,
        async (message) => {
          if (shouldUseHiveAuth()) {
            return signWithHiveAuth(username, message, accountData, "posting");
          }

          return signBuffer(username, message, "Posting").then((r) => r.result);
        }
      );

      await loginInApp(code, null, accountData, "keychain");
    },
    onError: (e) => error(...formatError(e))
  });
}
