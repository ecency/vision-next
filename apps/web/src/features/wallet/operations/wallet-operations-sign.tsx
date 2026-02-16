import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { AssetOperation, CONFIG, useWalletOperation } from "@ecency/sdk";
import type { AuthContextV2 } from "@ecency/sdk";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { UilLock } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import hs from "hivesigner";
import Image from "next/image";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { WalletOperationSigning } from "./wallet-operations-signing";
import { shouldUseHiveAuth, broadcastWithHiveAuth } from "@/utils/client";
import { getUser } from "@/utils";
import * as keychain from "@/utils/keychain";

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
  const useHiveAuth = shouldUseHiveAuth(activeUser?.username);
  const canUseKeychain = hasKeyChain || useHiveAuth;
  const keychainIcon = useHiveAuth ? "/assets/hive-auth.svg" : "/assets/keychain.png";
  const keychainAlt = useHiveAuth ? "hiveauth" : "keychain";
  const keychainLabel = useHiveAuth
    ? i18next.t("key-or-hot.with-hiveauth", { defaultValue: "Sign with HiveAuth" })
    : i18next.t("key-or-hot.with-keychain");

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
          return CONFIG.hiveClient.broadcast.sendOperations(operations, key);
        }

        if (method === "hivesigner") {
          // Redirect to HiveSigner — page navigates away, promise never resolves
          return new Promise(() => {
            hs.sendOperations(
              operations,
              { callback: `https://ecency.com/@${activeUser.username}/wallet` },
              () => {}
            );
          });
        }

        if (method === "hiveauth" || useHiveAuth) {
          if (authority === "active" || authority === "posting") {
            return broadcastWithHiveAuth(activeUser.username, operations, authority);
          }
          throw new Error(`[SDK][Auth] – unsupported authority "${authority}" for HiveAuth`);
        }

        if (method === "keychain" || hasKeyChain) {
          let keychainAuthority: "Active" | "Posting" | "Owner" | "Memo";
          if (authority === "active") {
            keychainAuthority = "Active";
          } else if (authority === "posting") {
            keychainAuthority = "Posting";
          } else if (authority === "owner") {
            keychainAuthority = "Owner";
          } else if (authority === "memo") {
            keychainAuthority = "Memo";
          } else {
            throw new Error(`[SDK][Auth] – invalid authority "${authority}" for keychain`);
          }
          return keychain
            .broadcast(activeUser.username, operations, keychainAuthority)
            .then((result: any) => result.result);
        }

        throw new Error("[SDK][Wallets] – missing broadcaster");
      }
    };
  }, [activeUser, useHiveAuth, hasKeyChain]);

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
    if (cryptoUtils.isWif(signingKey)) {
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
              signMethodRef.current = { method: useHiveAuth ? "hiveauth" : "keychain" };
              sign(data as any);
              setStep("signing");
            }}
            icon={
              <Image
                width={100}
                height={100}
                src={keychainIcon}
                className="w-4 h-4"
                alt={keychainAlt}
              />
            }
          >
            {keychainLabel}
          </Button>
        </motion.div>
      )}
      {step === "signing" && <WalletOperationSigning />}
    </>
  );
}
