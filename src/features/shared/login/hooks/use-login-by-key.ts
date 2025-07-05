import i18next from "i18next";
import { error } from "../../feedback";
import { cryptoUtils, PrivateKey, PublicKey } from "@hiveio/dhive";
import { Account } from "@/entities";
import { useMutation } from "@tanstack/react-query";
import { getAccount } from "@/api/hive";
import { EcencyConfigManager } from "@/config";
import { formatError, grantPostingPermission } from "@/api/operations";
import { makeHsCode } from "@/utils";
import { useLoginInApp } from "./use-login-in-app";
import { useGlobalStore } from "@/core/global-store";

async function signer(message: string, privateKey: PrivateKey) {
  const hash = cryptoUtils.sha256(message);
  return new Promise<string>((resolve) => resolve(privateKey.sign(hash).toString()));
}

export function useLoginByKey(username: string, keyOrSeed: string, isVerified: boolean) {
  const setSigningKey = useGlobalStore((state) => state.setSigningKey);
  const loginInApp = useLoginInApp(username);

  return useMutation({
    mutationKey: ["login-by-key", username, keyOrSeed, isVerified],
    mutationFn: async () => {
      if (username === "" || keyOrSeed === "") {
        throw new Error(i18next.t("login.error-fields-required"));
      }

      if (!isVerified) {
        throw new Error(i18next.t("login.captcha-check-required"));
      }

      // Warn if the code is a public key
      try {
        PublicKey.fromString(keyOrSeed);
        throw new Error(i18next.t("login.error-public-key"));
      } catch (e) {}

      let account: Account;

      try {
        account = await getAccount(username);
      } catch (err) {
        throw new Error(i18next.t("login.error-user-fetch"));
      }

      if (!account || account.name !== username) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      // Posting public key of the account
      const postingPublic = account?.posting!.key_auths.map((x) => x[0]);
      const isPlainPassword = !cryptoUtils.isWif(keyOrSeed);

      let privateKey: PrivateKey;

      // Whether using posting private key to login
      let withPostingKey = false;

      if (
        !isPlainPassword &&
        postingPublic.includes(PrivateKey.fromString(keyOrSeed).createPublic().toString())
      ) {
        // Login with posting private key
        withPostingKey = true;
        privateKey = PrivateKey.fromString(keyOrSeed);
      } else {
        // Login with master or active private key
        // Get active private key from user entered code
        if (isPlainPassword) {
          privateKey = PrivateKey.fromLogin(account.name, keyOrSeed, "active");
        } else {
          privateKey = PrivateKey.fromString(keyOrSeed);
        }

        // Generate public key from the private key
        const activePublicInput = privateKey.createPublic().toString();

        // Active public key of the account
        const activePublic = account?.active!.key_auths.map((x) => x[0]);

        // Compare keys
        if (!activePublic.includes(activePublicInput)) {
          throw new Error(i18next.t("login.error-authenticate")); // enter master or active key
        }

        const hasPostingPerm =
          account?.posting!.account_auths.filter(
            (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
          ).length > 0;

        if (!hasPostingPerm) {
          try {
            await grantPostingPermission(
              privateKey,
              account,
              EcencyConfigManager.CONFIG.service.hsClientId
            );
          } catch (err) {
            throw new Error(i18next.t("login.error-permission"));
          }
        }
      }

      // Prepare hivesigner code
      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        account.name,
        (message) => signer(message, privateKey)
      );

      await loginInApp(code, withPostingKey ? keyOrSeed : null, account);

      setSigningKey(privateKey.toString());
    },
    onError: (e) => error(...formatError(e))
  });
}
