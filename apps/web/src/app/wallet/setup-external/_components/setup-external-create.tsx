"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, KeyOrHot, Stepper } from "@/features/shared";
import { Button } from "@/features/ui";
import { WalletSeedPhrase, WalletTokenAddressItem } from "@/features/wallet";
import {
  EcencyTokenMetadata,
  EcencyWalletCurrency,
  useHiveKeysQuery,
  useSaveWalletInformationToMetadata,
  EcencyWalletsPrivateApi,
  useWalletsCacheQuery
} from "@ecency/wallets";
import { useAccountUpdateKeyAuths } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
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
import { getAccessToken, getSdkAuthContext } from "@/utils";
import { getUser } from "@/utils/user-token";
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
  EcencyWalletCurrency.BNB,
  EcencyWalletCurrency.SOL,
  EcencyWalletCurrency.TRON,
  EcencyWalletCurrency.APT,
  EcencyWalletCurrency.TON
];

function SetupExternalCreateInner({ username, onBack }: Props & { username: string }) {
  const [step, setStep] = useState<"seed" | "tokens" | "create" | "success" | "sign">("seed");

  const { data: keys } = useHiveKeysQuery(username);
  const { data: tokens } = useWalletsCacheQuery(username);
  const authContext = useMemo(
    () => getSdkAuthContext(getUser(username)),
    [username]
  );

  const { mutateAsync: saveKeys, isPending } = useAccountUpdateKeyAuths(username, {
    onError: (err) => {
      error(...formatError(err));
      setStep("sign");
    }
  });
  const { mutateAsync: saveTokens } = useSaveWalletInformationToMetadata(username, authContext, {
    onError: (err) => {
      error(...formatError(err));
      setStep("sign");
    }
  });
  const { mutateAsync: saveToPrivateApi } = EcencyWalletsPrivateApi.useUpdateAccountWithWallets(
    username,
    getAccessToken(username)
  );

  const handleLinkByKey = useCallback(
    async (currentKey: PrivateKey) => {
      if (!keys) {
        return;
      }
      if (!authContext) {
        error("[Wallets] Missing auth context for signing.");
        setStep("sign");
        return;
      }
      setStep("create");

      const tokenEntries = Array.from(tokens?.entries() ?? []);
      const walletAddresses = Object.fromEntries(
        tokenEntries
          .filter(([, info]) => Boolean(info.address))
          .map(([token, info]) => [token as string, info.address!])
      ) as Record<string, string>;

      await saveTokens(tokenEntries.map(([, info]) => info));
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
      await saveToPrivateApi({
        tokens: walletAddresses,
        hiveKeys: {
          ownerPublicKey: PrivateKey.fromString(keys.owner).createPublic().toString(),
          activePublicKey: PrivateKey.fromString(keys.active).createPublic().toString(),
          postingPublicKey: PrivateKey.fromString(keys.posting).createPublic().toString(),
          memoPublicKey: PrivateKey.fromString(keys.memo).createPublic().toString()
        }
      });
      setStep("success");
    },
    [username, authContext, keys, saveKeys, saveToPrivateApi, saveTokens, tokens]
  );

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
            showRefreshButton={false}
            username={username}
            onValidated={() => setStep("tokens")}
          />
        )}
        {step === "tokens" && (
          <div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {TOKENS.map((currency, i) => (
                <WalletTokenAddressItem username={username} i={i} key={i} currency={currency} />
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
            <div className="pt-4 lg:pt-6 w-full flex flex-col items-start gap-4">
              <KeyOrHot inProgress={isPending} onKey={handleLinkByKey} authority={"owner"} />
            </div>
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

export function SetupExternalCreate({ onBack }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  if (!username) {
    return (
      <div className="text-center py-8 text-gray-500">
        {i18next.t("g.login")} required to setup external wallets
      </div>
    );
  }

  return <SetupExternalCreateInner username={username} onBack={onBack} />;
}
