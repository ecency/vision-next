import { useClientActiveUser } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { AssetOperation, useWalletOperation } from "@ecency/wallets";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { UilLock } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { WalletOperationSigning } from "./wallet-operations-signing";
import { shouldUseHiveAuth } from "@/utils/client";

interface Props {
  asset: string;
  operation: AssetOperation;
  data: Record<string, unknown>;
  onSignSuccess: () => void;
  onSignError: (error: Error) => void;
}

export function WalletOperationSign({ data, onSignError, onSignSuccess, asset, operation }: Props) {
  const activeUser = useClientActiveUser();

  const hasKeyChain = useGlobalStore((state) => state.hasKeyChain);
  const signingKey = useGlobalStore((state) => state.signingKey);
  const setSigningKey = useGlobalStore((state) => state.setSigningKey);
  const canUseKeychain = hasKeyChain || shouldUseHiveAuth();

  const [step, setStep] = useState<"sign" | "signing">("sign");

  const {
    mutateAsync: sign,
    error,
    isSuccess
  } = useWalletOperation(data.from as string, asset, operation);

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
    sign({
      ...(data as any),
      type: "key",
      key
    });
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
              sign({
                ...(data as any),
                type: "hivesigner"
              });
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
              sign({
                ...(data as any),
                type: "keychain"
              });
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
            {i18next.t("key-or-hot.with-keychain")}
          </Button>
        </motion.div>
      )}
      {step === "signing" && <WalletOperationSigning />}
    </>
  );
}
