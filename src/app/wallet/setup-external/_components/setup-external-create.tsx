"use client";

import { useClientActiveUser } from "@/api/queries";
import { Stepper } from "@/features/shared";
import { Button } from "@/features/ui";
import { WalletSeedPhrase, WalletTokenAddressItem } from "@/features/wallet";
import {
  EcencyTokenMetadata,
  EcencyWalletCurrency,
  useHiveKeysQuery,
  useSaveWalletInformationToMetadata,
  useSeedPhrase
} from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import {
  UilArrowLeft,
  UilArrowRight,
  UilArrowUpRight,
  UilBitcoinSign,
  UilCheckCircle,
  UilLock,
  UilSpinner,
  UilUser
} from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";

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

  const [step, setStep] = useState<"seed" | "tokens" | "create" | "success" | "error">("seed");

  const { data: keys } = useHiveKeysQuery(activeUser?.username!);
  const { data: tokens } = useQuery<Map<EcencyWalletCurrency, EcencyTokenMetadata>>({
    queryKey: ["ecency-wallets", "wallets", activeUser?.username]
  });

  const { mutateAsync: saveTokens } = useSaveWalletInformationToMetadata(activeUser?.username!);

  const handleLink = useCallback(async () => {
    setStep("create");
    await saveTokens(Array.from(tokens?.values() ?? []));
  }, [saveTokens, tokens]);

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
        {["seed", "tokens"].includes(step) && (
          <div className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
            {i18next.t("profile-wallet.external-wallets-signup.create-wallet-title")}
          </div>
        )}
        <div className="opacity-50">
          {step === "seed" && i18next.t("signup-wallets.seed.description")}
          {step === "tokens" &&
            i18next.t("profile-wallet.external-wallets-signup.create-wallet-tokens-description")}
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
              <Button icon={<UilArrowRight />} size="sm" onClick={handleLink}>
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
