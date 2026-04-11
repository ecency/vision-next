import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginInApp } from "./use-login-in-app";
import { EcencyConfigManager } from "@/config";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { makeHsCode, signBuffer } from "@/utils";
import { shouldUseKeychainMobile } from "@/utils/client";
import i18next from "i18next";
import { error } from "../../feedback";
import { formatError } from "@/api/format-error";
import { LoginType } from "@/entities";
import { HiveSignerMessage } from "@/types";
import { encodeMsg } from "hive-uri";

const KEYCHAIN_MOBILE_STORAGE_KEY = "ecency_keychain-mobile-pending-login";

export interface KeychainMobilePendingLogin {
  username: string;
  messageObj: HiveSignerMessage;
  timestamp: number;
}

export function useLoginByKeychain(username: string) {
  const loginInApp = useLoginInApp(username);

  const queryClient = getQueryClient();
  const accountQueryOptions = getAccountFullQueryOptions(username);
  const { data: account } = useQuery(accountQueryOptions);

  const mutation = useMutation({
    mutationKey: ["login-by-keychain", username, account],
    mutationFn: async () => {
      const accountData = account ?? (await queryClient.fetchQuery(accountQueryOptions));

      if (!accountData) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      const useKeychainMobile = shouldUseKeychainMobile();
      const loginMethod: LoginType = useKeychainMobile ? "keychain-mobile" : "keychain";

      if (useKeychainMobile) {
        // Deep link flow: generate message, store pending login, open hive:// URI
        const hsClientId = EcencyConfigManager.CONFIG.service.hsClientId;
        const timestamp = Math.floor(Date.now() / 1000);

        const messageObj: HiveSignerMessage = {
          signed_message: { type: "code", app: hsClientId },
          authors: [username],
          timestamp
        };

        // Store pending login data for the callback page
        const pendingLogin: KeychainMobilePendingLogin = {
          username,
          messageObj,
          timestamp: Date.now()
        };
        localStorage.setItem(KEYCHAIN_MOBILE_STORAGE_KEY, JSON.stringify(pendingLogin));

        // Use hive-uri library to build the deep link with proper encoding
        const callbackUrl = `${window.location.origin}/auth/keychain-mobile?sig={{sig}}`;
        const deepLink = encodeMsg(JSON.stringify(messageObj), {
          signer: username,
          authority: "posting",
          callback: callbackUrl
        });

        // Open the deep link - this will switch to Keychain/Ecency mobile app
        window.location.href = deepLink;
        return;
      }

      // Desktop Keychain extension flow
      const signMessage = async (message: string) => {
        return signBuffer(username, message, "Posting").then((r) => r.result);
      };

      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        username,
        signMessage
      );

      await loginInApp(code, null, accountData, loginMethod);
    },
    onError: (e) => error(...formatError(e))
  });

  return {
    ...mutation,
    retryCountdown: null,
    isRetryScheduled: false,
    retryAttempt: 0,
    maxAttempts: 0
  };
}
