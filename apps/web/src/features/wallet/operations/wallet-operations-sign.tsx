import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { MetaMaskSignButton } from "@/features/shared";
import { AssetOperation, broadcastOperations, useWalletOperation } from "@ecency/sdk";
import type { AuthContextV2 } from "@ecency/sdk";
import { PrivateKey } from "@ecency/sdk";
import { isWif } from "@ecency/sdk";
import { UilLock } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import hs from "hivesigner";
import Image from "next/image";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { WalletOperationSigning } from "./wallet-operations-signing";
import { shouldUseKeychainMobile } from "@/utils/client";
import { getLoginType } from "@/utils/user-token";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { buildHsCallbackUrl } from "@/utils/hs-callback";

interface Props {
  asset: string;
  operation: AssetOperation;
  data: Record<string, unknown>;
  onSignSuccess: () => void;
  onSignError: (error: Error) => void;
}

export function WalletOperationSign({ data, onSignError, onSignSuccess, asset, operation }: Props) {
  const { activeUser } = useActiveAccount();

  const hasKeyChain = useGlobalStore((state) => state.hasKeyChain);
  const signingKey = useGlobalStore((state) => state.signingKey);
  const setSigningKey = useGlobalStore((state) => state.setSigningKey);
  const useKcMobile = shouldUseKeychainMobile(activeUser?.username);
  const canUseKeychain = hasKeyChain || useKcMobile;
  const keychainLabel = useKcMobile
    ? i18next.t("key-or-hot.with-keychain-mobile", { defaultValue: "Sign with Keychain Mobile" })
    : i18next.t("key-or-hot.with-keychain");
  const isMetaMaskUser = activeUser && getLoginType(activeUser.username) === "metamask";

  const [step, setStep] = useState<"sign" | "signing">("sign");

  // Track which auth method the user chose (set before calling sign)
  const signMethodRef = useRef<{ method: string; key?: PrivateKey }>({ method: "" });

  // Create auth context with broadcast that dispatches based on chosen sign method
  const authContext = useMemo<AuthContextV2 | undefined>(() => {
    if (!activeUser?.username) return undefined;

    return {
      broadcast: (operations, authority = "posting") => {
        const { method, key } = signMethodRef.current;

        if (method === "key" && key) {
          return broadcastOperations(operations, key);
        }

        if (method === "metamask") {
          const adapter = getWebBroadcastAdapter();
          return adapter.broadcastWithKeychain!(activeUser.username, operations, authority as any);
        }

        if (method === "hivesigner") {
          // Opens HiveSigner in a new tab for signing.
          // After signing, user is redirected to /auth/hs-callback which shows
          // success/error and then redirects to the wallet page.
          return new Promise(() => {
            hs.sendOperations(
              operations,
              { callback: buildHsCallbackUrl(`/@${activeUser.username}/wallet`) },
              () => {}
            );
          });
        }

        if (method === "keychain" || hasKeyChain) {
          // Route through adapter's broadcastWithKeychain which handles
          // keychain-mobile deep links, MetaMask snap, and browser extension
          const adapter = getWebBroadcastAdapter();
          const kType = authority === "active" ? "active"
            : authority === "posting" ? "posting"
            : authority === "owner" ? "owner"
            : "memo" as const;
          return adapter.broadcastWithKeychain!(activeUser.username, operations, kType);
        }

        throw new Error("[SDK][Wallets] – missing broadcaster");
      }
    };
  }, [activeUser, hasKeyChain]);

  const {
    mutateAsync: sign,
    error,
    isSuccess
  } = useWalletOperation(
    data.from as string,
    asset,
    operation,
    authContext
  );

  useEffect(() => {
    if (error) {
      onSignError(error);
    }
  }, [error, onSignError]);

  useEffect(() => {
    if (isSuccess) {
      onSignSuccess();
    }
  }, [isSuccess, onSignSuccess]);

  const signKey = useCallback(() => {
    if (!signingKey || !activeUser) {
      return;
    }

    let key: PrivateKey;
    if (isWif(signingKey)) {
      key = PrivateKey.fromString(signingKey);
    } else {
      key = PrivateKey.fromLogin(activeUser.username, signingKey);
    }
    signMethodRef.current = { method: "key", key };
    sign(data as any);
    setStep("signing");
  }, [signingKey, activeUser, sign, data]);

  return (
    <>
      {step === "sign" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-[--border-color] grid grid-cols-2 p-4 gap-4 items-start overflow-hidden"
        >
          {isMetaMaskUser ? (
            <div className="col-span-2 flex justify-center">
              <MetaMaskSignButton
                onClick={() => {
                  signMethodRef.current = { method: "metamask" };
                  sign(data as any);
                  setStep("signing");
                }}
              />
            </div>
          ) : (
            <>
              <div className="col-span-2">
                <div className="uppercase text-xs pb-2 font-semibold text-gray-600 dark:text-gray-400">
                  sign with private key
                </div>

                <InputGroup
                  append={
                    <Button size="sm" icon={<UilLock />} onClick={signKey}>
                      {i18next.t("market.sign")}
                    </Button>
                  }
                >
                  <FormControl
                    value={signingKey ?? ""}
                    type="password"
                    placeholder="Key"
                    onChange={(e) => setSigningKey(e.target.value)}
                  />
                </InputGroup>
              </div>
              <Button
                size="lg"
                outline={true}
                appearance="hivesigner"
                onClick={() => {
                  signMethodRef.current = { method: "hivesigner" };
                  sign(data as any);
                  setStep("signing");
                }}
                icon={
                  <Image
                    width={100}
                    height={100}
                    src="/assets/hive-signer.svg"
                    className="w-4 h-4"
                    alt="hivesigner"
                  />
                }
              >
                {i18next.t("key-or-hot.with-hivesigner")}
              </Button>

              <Button
                outline={true}
                appearance="secondary"
                size="lg"
                disabled={!canUseKeychain}
                onClick={() => {
                  const method = "keychain";
                  signMethodRef.current = { method };
                  sign(data as any);
                  setStep("signing");
                }}
                icon={
                  <Image
                    width={100}
                    height={100}
                    src="/assets/keychain.png"
                    className="w-4 h-4"
                    alt="keychain"
                  />
                }
              >
                {keychainLabel}
              </Button>
            </>
          )}
        </motion.div>
      )}
      {step === "signing" && <WalletOperationSigning />}
    </>
  );
}
