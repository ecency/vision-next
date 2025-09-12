import i18next from "i18next";
import { error } from "../../feedback";
import { cryptoUtils, PrivateKey, PublicKey } from "@hiveio/dhive";
import { deriveHiveKeys, detectHiveKeyDerivation } from "@ecency/wallets";
import { FullAccount } from "@/entities";
import { useMutation } from "@tanstack/react-query";
import { client as hiveClient, getAccount } from "@/api/hive";
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

      let account: FullAccount;

      try {
        account = await getAccount(username);
      } catch (err) {
        const wrapped = new Error(i18next.t("login.error-user-fetch"));
        (wrapped as any).cause = err;
        throw wrapped;
      }

      if (!account || account.name !== username) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      const isPlainPassword = !cryptoUtils.isWif(keyOrSeed);

      let privateKey: PrivateKey;
      let postingKey: PrivateKey | null = null;

      // Whether using posting private key to login
      let withPostingKey = false;

      const isPostingKey =
        !isPlainPassword &&
        account.posting.key_auths.some(([pub]) => {
          try {
            return (
              pub ===
              PrivateKey.fromString(keyOrSeed).createPublic().toString()
            );
          } catch {
            return false;
          }
        });

      if (isPostingKey) {
        // Login with posting private key
        withPostingKey = true;
        privateKey = PrivateKey.fromString(keyOrSeed);
        postingKey = privateKey;
      } else {
        // Login with master password, BIP44 seed or active private key
        // Get active and posting private keys from user entered code
        if (isPlainPassword) {
          const derivation = await detectHiveKeyDerivation(
            account.name,
            keyOrSeed,
            hiveClient
          );

          const candidates: { active: PrivateKey; posting: PrivateKey }[] = [];
          const addBip44Candidates = (mnemonic: string, max = 10) => {
            for (let i = 0; i < max; i++) {
              try {
                const keys = deriveHiveKeys(mnemonic, i);
                candidates.push({
                  active: PrivateKey.fromString(keys.active),
                  posting: PrivateKey.fromString(keys.posting)
                });
              } catch {}
            }
          };

          if (derivation === "bip44") {
            addBip44Candidates(keyOrSeed);
          } else if (derivation === "master-password") {
            candidates.push({
              active: PrivateKey.fromLogin(account.name, keyOrSeed, "active"),
              posting: PrivateKey.fromLogin(account.name, keyOrSeed, "posting")
            });
            addBip44Candidates(keyOrSeed);
          } else {
            addBip44Candidates(keyOrSeed);
            candidates.push({
              active: PrivateKey.fromLogin(account.name, keyOrSeed, "active"),
              posting: PrivateKey.fromLogin(account.name, keyOrSeed, "posting")
            });
          }

          let activeMatch: { active: PrivateKey; posting: PrivateKey } | undefined;
          let postingMatch: { active: PrivateKey; posting: PrivateKey } | undefined;

          for (const c of candidates) {
            if (
              !activeMatch &&
              account.active.key_auths.some(
                ([pub]) => pub === c.active.createPublic().toString()
              )
            ) {
              activeMatch = c;
            }

            if (
              !postingMatch &&
              account.posting.key_auths.some(
                ([pub]) => pub === c.posting.createPublic().toString()
              )
            ) {
              postingMatch = c;
            }

            if (activeMatch && postingMatch) {
              break;
            }
          }

          const match = activeMatch || postingMatch;

          if (!match) {
            throw new Error(i18next.t("login.error-authenticate"));
          }

          if (activeMatch) {
            privateKey = match.active;
            postingKey = match.posting;
          } else {
            privateKey = match.posting;
            postingKey = match.posting;
            withPostingKey = true;
          }
        } else {
          privateKey = PrivateKey.fromString(keyOrSeed);
        }

        // Generate public key from the private key
        const activePublicInput = privateKey.createPublic().toString();

        // Compare keys against all active authorities
        const hasActiveKey = account.active.key_auths.some(
          ([pub]) => pub === activePublicInput
        );

        if (!hasActiveKey && !withPostingKey) {
          throw new Error(i18next.t("login.error-authenticate")); // enter master or active key
        }

        const hasPostingPerm =
          account?.posting!.account_auths.filter(
            (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
          ).length > 0;

        if (!hasPostingPerm && !withPostingKey) {
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

      await loginInApp(code, postingKey ? postingKey.toString() : null, account, "privateKey");

      setSigningKey(privateKey.toString());
    },
    onError: (e) => error(...formatError(e))
  });
}
