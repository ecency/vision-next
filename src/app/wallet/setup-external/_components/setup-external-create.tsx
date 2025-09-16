"use client";

import { formatError } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { error, Stepper } from "@/features/shared";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { WalletSeedPhrase, WalletTokenAddressItem } from "@/features/wallet";
import { useAccountUpdateKeyAuths } from "@ecency/sdk";
import {
  EcencyTokenMetadata,
  EcencyWalletCurrency,
  useHiveKeysQuery,
  useSaveWalletInformationToMetadata
} from "@ecency/wallets";
import { cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import {
  UilArrowLeft,
  UilArrowRight,
  UilArrowUpRight,
  UilBitcoinSign,
  UilCheckCircle,
  UilLock,
  UilSpinner,
  UilTransaction,
  UilUser
} from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useState } from "react";

interface Props {
  onBack: () => void;
}

const steps = [
  {
    step: "seed",
    title: "Seed phrase",
    icon: <UilLock />,
    description: "Generate and backup seed phrase for all wallets and Hive"
  },
  {
    step: "tokens",
    title: "Tokens",
    icon: <UilBitcoinSign />,
    description: "List of tokens to be added to your wallet"
  },
  {
    step: "sign",
    title: "Sign changes",
    icon: <UilTransaction />,
    description: "Sign changes to initiate linking"
  },
  {
    step: "create",
    title: "Link tokens with Hive/Ecency",
    icon: <UilUser />,
    description: "Finalize tokens linking to Ecency account"
  }
];

const TOKENS = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.SOL,
  EcencyWalletCurrency.TRON,
  EcencyWalletCurrency.APT,
  EcencyWalletCurrency.ATOM
];

export function SetupExternalCreate({ onBack }: Props) {
  const activeUser = useClientActiveUser();

  const [keyInput, setKeyInput] = useState("");
  const [step, setStep] = useState<"seed" | "tokens" | "create" | "success" | "sign">("seed");

  const { data: keys } = useHiveKeysQuery(activeUser?.username!);
  const { data: tokens } = useQuery<Map<EcencyWalletCurrency, EcencyTokenMetadata>>({
    queryKey: ["ecency-wallets", "wallets", activeUser?.username]
  });

  const { mutateAsync: saveKeys, isPending } = useAccountUpdateKeyAuths(activeUser?.username!, {
    onError: (err) => {
      error(...formatError(err));
      setStep("sign");
    }
  });
  const { mutateAsync: saveTokens } = useSaveWalletInformationToMetadata(activeUser?.username!, {
    onError: (err) => {
      error(...formatError(err));
      setStep("sign");
    }
  });

  const handleLink = useCallback(async () => {
    if (!keys) {
      return;
    }

    const currentKey = cryptoUtils.isWif(keyInput)
      ? PrivateKey.fromString(keyInput)
      : PrivateKey.fromLogin(activeUser?.username!, keyInput, "owner");

    setStep("create");
    await saveTokens(Array.from(tokens?.values() ?? []));
    await saveKeys({
      keepCurrent: true,
      currentKey,
      keys: [
        {
          owner: PrivateKey.fromString(keys.owner),
          active: PrivateKey.fromString(keys.active),
          posting: PrivateKey.fromString(keys.posting),
          memo_key: PrivateKey.fromString(keys.memo)
        }
      ]
    });
    setStep("success");
  }, [activeUser?.username, keyInput, keys, saveKeys, saveTokens, tokens]);

  return (
    <div className="w-full col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
      <Stepper steps={steps} currentStep={step} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 bg-white rounded-2xl p-6 flex flex-col items-start justify-between"
      >
        <Button
          size="sm"
          appearance="gray-link"
          icon={<UilArrowLeft />}
          iconPlacement="left"
          noPadding={true}
          onClick={onBack}
        >
          {i18next.t("g.back")}
        </Button>
        {["seed", "tokens", "sign"].includes(step) && (
          <div className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
            {i18next.t("profile-wallet.external-wallets-signup.create-wallet-title")}
          </div>
        )}
        <div className="opacity-50">
          {step === "seed" && i18next.t("signup-wallets.seed.description")}
          {step === "tokens" &&
            i18next.t("profile-wallet.external-wallets-signup.create-wallet-tokens-description")}
          {step === "sign" && i18next.t("account-recovery.sign-title")}
        </div>
        {step === "seed" && (
          <WalletSeedPhrase
            showTitle={false}
            username={activeUser?.username!}
            onValidated={() => setStep("tokens")}
          />
        )}
        {step === "tokens" && (
          <div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {TOKENS.map((currency, i) => (
                <WalletTokenAddressItem
                  username={activeUser?.username!!}
                  i={i}
                  key={i}
                  currency={currency}
                />
              ))}
            </div>
            <div className="flex mt-4 justify-end">
              <Button icon={<UilArrowRight />} size="sm" onClick={() => setStep("sign")}>
                {i18next.t("g.continue")}
              </Button>
            </div>
          </div>
        )}
        <AnimatePresence>
          {step === "create" && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col justify-center max-w-[600px] mx-auto min-h-[400px]"
            >
              <UilSpinner className="animate-spin duration-500 opacity-50 w-16 h-16" />
              <div className="text-xl text-center font-semibold mt-4">
                {i18next.t("profile-wallet.external-wallets-signup.linking")}
              </div>
              <div className="opacity-50 text-center mt-2">
                {i18next.t("profile-wallet.external-wallets-signup.linking-hint")}
              </div>
            </motion.div>
          )}
          {step === "sign" && (
            <InputGroup
              className="my-4"
              prepend={<UilLock />}
              append={
                <Button disabled={isPending} onClick={handleLink}>
                  {i18next.t("key-or-hot.sign")}
                </Button>
              }
            >
              <FormControl
                value={keyInput}
                type="password"
                autoFocus={true}
                autoComplete="off"
                placeholder={i18next.t("key-or-hot.key-placeholder")}
                onChange={(e) => setKeyInput(e.target.value)}
              />
            </InputGroup>
          )}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col justify-center max-w-[600px] mx-auto min-h-[400px]"
            >
              <UilCheckCircle className="text-green w-16 h-16" />
              <div className="text-xl text-center font-semibold mt-4">
                {i18next.t("profile-wallet.external-wallets-signup.linking-success")}
              </div>
              <div className="opacity-50 text-center mt-2 mb-4">
                {i18next.t("profile-wallet.external-wallets-signup.linking-success-hint")}
              </div>
              <Button href="/wallet" icon={<UilArrowUpRight />} size="lg">
                {i18next.t("user-nav.wallet")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
