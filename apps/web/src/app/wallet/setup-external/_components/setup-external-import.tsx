"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, KeyOrHot, Stepper } from "@/features/shared";
import { Button } from "@/features/ui";
import { WalletTokenAddressItem } from "@/features/wallet";
import {
  EcencyWalletCurrency,
  useSaveWalletInformationToMetadata,
  EcencyWalletsPrivateApi,
  useWalletsCacheQuery,
  deriveHiveKeys
} from "@ecency/wallets";
import { useAccountUpdateKeyAuths, getAccountFullQueryOptions } from "@ecency/sdk";
import { PrivateKey } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import {
  UilArrowLeft,
  UilArrowRight,
  UilArrowUpRight,
  UilBitcoinSign,
  UilCheckCircle,
  UilExclamationTriangle,
  UilFileImport,
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
import { validateMnemonic } from "bip39";

interface Props {
  onBack: () => void;
}

const TOKENS = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.BNB,
  EcencyWalletCurrency.SOL,
  EcencyWalletCurrency.TRON,
  EcencyWalletCurrency.APT,
  EcencyWalletCurrency.TON
];

function SetupExternalImportInner({ username, onBack }: Props & { username: string }) {
  const [step, setStep] = useState<"import" | "hive-keys" | "tokens" | "link" | "success" | "sign">(
    "import"
  );
  const [seedPhrase, setSeedPhrase] = useState("");
  const [importHiveKeys, setImportHiveKeys] = useState(false);
  const [hiveKeys, setHiveKeys] = useState<ReturnType<typeof deriveHiveKeys> | null>(null);

  const steps = useMemo(
    () => [
      {
        step: "import",
        title: i18next.t("permissions.add-keys.import.step-import-title"),
        icon: <UilFileImport />,
        description: i18next.t("permissions.add-keys.import.step-import-description")
      },
      {
        step: "hive-keys",
        title: i18next.t("permissions.add-keys.import.step-hive-keys-title"),
        icon: <UilLock />,
        description: i18next.t("permissions.add-keys.import.step-hive-keys-description")
      },
      {
        step: "tokens",
        title: i18next.t("permissions.add-keys.import.step-tokens-title"),
        icon: <UilBitcoinSign />,
        description: i18next.t("permissions.add-keys.import.step-tokens-description")
      },
      {
        step: "sign",
        title: i18next.t("permissions.add-keys.import.step-sign-title"),
        icon: <UilTransaction />,
        description: i18next.t("permissions.add-keys.import.step-sign-description")
      },
      {
        step: "link",
        title: i18next.t("permissions.add-keys.import.step-link-title"),
        icon: <UilUser />,
        description: i18next.t("permissions.add-keys.import.step-link-description")
      }
    ],
    []
  );

  const { data: tokens } = useWalletsCacheQuery(username);
  const { data: account } = useQuery(getAccountFullQueryOptions(username));

  const allWalletsDerived = useMemo(() => {
    if (!tokens) return false;
    return TOKENS.every((currency) => {
      const wallet = tokens.get(currency);
      return wallet && Boolean(wallet.address);
    });
  }, [tokens]);

  const hasExistingChainTokens = useMemo(() => {
    const profileTokens = account?.profile?.tokens;
    if (!profileTokens || !Array.isArray(profileTokens)) return false;
    return profileTokens.some(
      (t) =>
        t.type === "CHAIN" ||
        Object.values(EcencyWalletCurrency).includes(t.symbol as EcencyWalletCurrency)
    );
  }, [account]);

  const authContext = useMemo(() => getSdkAuthContext(getUser(username)), [username]);

  const { mutateAsync: saveKeys, isPending: isSavingKeys } = useAccountUpdateKeyAuths(username, {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;

      // Validate content is a string
      if (typeof content !== "string") {
        error(i18next.t("permissions.add-keys.import.error-invalid-file"));
        return;
      }

      // Try different file formats
      let extractedSeed: string | null = null;

      // 1. Try Ecency seed file format (Seed: <seed phrase>)
      const seedMatch = content.match(/^Seed:\s*(.+?)$/m);
      if (seedMatch && seedMatch[1]) {
        extractedSeed = seedMatch[1].trim();
      } else {
        // 2. Try JSON format
        try {
          const json = JSON.parse(content);
          if (json.seed && typeof json.seed === "string") {
            extractedSeed = json.seed.trim();
          }
        } catch {
          // 3. Fall back to treating entire content as seed phrase
          extractedSeed = content.trim();
        }
      }

      if (extractedSeed) {
        setSeedPhrase(extractedSeed);
      } else {
        error(i18next.t("permissions.add-keys.import.error-invalid-file-format"));
      }
    };
    reader.readAsText(file);
  };

  const handleValidateSeed = () => {
    const trimmedSeed = seedPhrase.trim().toLowerCase();
    const words = trimmedSeed.split(/\s+/);

    if (words.length !== 12) {
      error(i18next.t("permissions.add-keys.import.error-word-count"));
      return;
    }

    if (!validateMnemonic(trimmedSeed)) {
      error(i18next.t("permissions.add-keys.import.error-invalid-seed"));
      return;
    }

    // Derive Hive keys from seed to check if user wants to import them
    try {
      const derived = deriveHiveKeys(trimmedSeed);
      setHiveKeys(derived);
      setStep("hive-keys");
    } catch (err) {
      error(i18next.t("permissions.add-keys.import.error-derive-keys"));
    }
  };

  const checkIfKeysAlreadyExist = () => {
    if (!account || !hiveKeys) return false;

    // Check if any of the derived public keys already exist in the account
    const ownerKeys = account.owner?.key_auths?.map(([key]) => key) || [];
    const activeKeys = account.active?.key_auths?.map(([key]) => key) || [];
    const postingKeys = account.posting?.key_auths?.map(([key]) => key) || [];

    return (
      ownerKeys.includes(hiveKeys.ownerPubkey) ||
      activeKeys.includes(hiveKeys.activePubkey) ||
      postingKeys.includes(hiveKeys.postingPubkey)
    );
  };

  const handleHiveKeysDecision = (shouldImport: boolean) => {
    setImportHiveKeys(shouldImport);
    // Populate wallet addresses using the imported seed
    // The WalletTokenAddressItem components will use the seed from cache
    setStep("tokens");
  };

  const handleLinkByKey = useCallback(
    async (currentKey: PrivateKey) => {
      if (!authContext) {
        error("[Wallets] Missing auth context for signing.");
        setStep("sign");
        return;
      }

      if (!hiveKeys) {
        error("[Wallets] Missing derived Hive keys.");
        setStep("sign");
        return;
      }

      setStep("link");

      try {
        const tokenEntries = Array.from(tokens?.entries() ?? []);

        // Only include entries with valid addresses
        const entriesWithAddresses = tokenEntries.filter(([, info]) => Boolean(info.address));

        // Validate we have at least some wallets with addresses
        if (entriesWithAddresses.length === 0) {
          error(i18next.t("permissions.add-keys.import.error-no-wallets"));
          setStep("tokens");
          return;
        }

        const walletAddresses = Object.fromEntries(
          entriesWithAddresses.map(([token, info]) => [token as string, info.address!])
        ) as Record<string, string>;

        // Only save tokens that have addresses
        await saveTokens(entriesWithAddresses.map(([, info]) => info));

        // Import Hive keys if user chose to
        if (importHiveKeys) {
          await saveKeys({
            keepCurrent: true,
            currentKey,
            keys: [
              {
                owner: PrivateKey.fromString(hiveKeys.owner),
                active: PrivateKey.fromString(hiveKeys.active),
                posting: PrivateKey.fromString(hiveKeys.posting),
                memo_key: PrivateKey.fromString(hiveKeys.memo)
              }
            ]
          });
        }

        await saveToPrivateApi({
          tokens: walletAddresses,
          hiveKeys: {
            ownerPublicKey: hiveKeys.ownerPubkey,
            activePublicKey: hiveKeys.activePubkey,
            postingPublicKey: hiveKeys.postingPubkey,
            memoPublicKey: hiveKeys.memoPubkey
          }
        });
        setStep("success");
      } catch (err) {
        error(...formatError(err));
        setStep("sign");
      }
    },
    [authContext, hiveKeys, importHiveKeys, saveKeys, saveToPrivateApi, saveTokens, tokens]
  );

  return (
    <div className="w-full col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
      <Stepper steps={steps} currentStep={step} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 bg-white dark:bg-dark-200 rounded-2xl p-6 flex flex-col items-start justify-between"
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

        {/* Step 1: Import Seed Phrase */}
        {step === "import" && (
          <div className="w-full">
            <div className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
              {i18next.t("permissions.add-keys.import.title")}
            </div>
            <div className="opacity-50 mb-4">
              {i18next.t("permissions.add-keys.import.description")}
            </div>

            {hasExistingChainTokens && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4 flex items-start gap-3">
                <UilExclamationTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  {i18next.t("permissions.add-keys.import.existing-tokens-warning")}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                {i18next.t("permissions.add-keys.import.warning")}
              </div>
            </div>

            <textarea
              className="w-full border-2 border-[--border-color] rounded-xl p-4 min-h-[120px] font-mono text-sm focus:outline-none focus:border-blue-500 dark:bg-dark-200"
              placeholder={i18next.t("permissions.add-keys.import.placeholder")}
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
            />

            <div className="flex gap-2 mt-4 justify-between items-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  {i18next.t("permissions.add-keys.import.load-from-file")}
                </span>
              </label>
              <Button icon={<UilArrowRight />} onClick={handleValidateSeed}>
                {i18next.t("g.next")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Hive Keys Decision */}
        {step === "hive-keys" && (
          <div className="w-full">
            <div className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
              {i18next.t("permissions.add-keys.import.hive-keys-title")}
            </div>
            <div className="opacity-50 mb-4">
              {i18next.t("permissions.add-keys.import.hive-keys-description")}
            </div>

            {checkIfKeysAlreadyExist() ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-green-800 dark:text-green-200">
                  {i18next.t("permissions.add-keys.import.hive-keys-already-added")}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <div>
                    <span className="font-semibold">
                      {i18next.t("permissions.add-keys.import.owner-key")}:
                    </span>{" "}
                    <span className="font-mono text-xs">{hiveKeys?.ownerPubkey}</span>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {i18next.t("permissions.add-keys.import.active-key")}:
                    </span>{" "}
                    <span className="font-mono text-xs">{hiveKeys?.activePubkey}</span>
                  </div>
                  <div>
                    <span className="font-semibold">
                      {i18next.t("permissions.add-keys.import.posting-key")}:
                    </span>{" "}
                    <span className="font-mono text-xs">{hiveKeys?.postingPubkey}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-4 justify-end">
              {checkIfKeysAlreadyExist() ? (
                <Button icon={<UilArrowRight />} onClick={() => handleHiveKeysDecision(false)}>
                  {i18next.t("g.continue")}
                </Button>
              ) : (
                <>
                  <Button appearance="gray" onClick={() => handleHiveKeysDecision(false)}>
                    {i18next.t("permissions.add-keys.import.skip-hive-keys")}
                  </Button>
                  <Button icon={<UilArrowRight />} onClick={() => handleHiveKeysDecision(true)}>
                    {i18next.t("permissions.add-keys.import.import-hive-keys")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review Token Addresses */}
        {step === "tokens" && (
          <div className="w-full">
            <div className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
              {i18next.t("permissions.add-keys.import.tokens-title")}
            </div>
            <div className="opacity-50 mb-4">
              {i18next.t("permissions.add-keys.import.tokens-description")}
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {TOKENS.map((currency, i) => (
                <WalletTokenAddressItem
                  username={username}
                  i={i}
                  key={i}
                  currency={currency}
                  importedSeed={seedPhrase.trim().toLowerCase()}
                />
              ))}
            </div>

            <div className="flex gap-4 mt-4 justify-between">
              <Button
                appearance="gray-link"
                icon={<UilArrowLeft />}
                onClick={() => setStep("hive-keys")}
              >
                {i18next.t("g.back")}
              </Button>
              <Button
                icon={<UilArrowRight />}
                onClick={() => setStep("sign")}
                disabled={!allWalletsDerived}
              >
                {i18next.t("g.continue")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Sign */}
        <AnimatePresence>
          {step === "sign" && (
            <div className="pt-4 lg:pt-6 w-full flex flex-col items-start gap-4">
              <div className="font-bold text-xl">
                {i18next.t("permissions.add-keys.import.sign-title")}
              </div>
              <div className="opacity-50">{i18next.t("account-recovery.sign-title")}</div>
              <KeyOrHot inProgress={isSavingKeys} onKey={handleLinkByKey} authority={"owner"} keyOnly />
            </div>
          )}

          {/* Step 5: Linking */}
          {step === "link" && (
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

          {/* Step 6: Success */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col justify-center max-w-[600px] mx-auto min-h-[400px]"
            >
              <UilCheckCircle className="text-green w-16 h-16" />
              <div className="text-xl text-center font-semibold mt-4">
                {i18next.t("permissions.add-keys.import.success-title")}
              </div>
              <div className="opacity-50 text-center mt-2 mb-4">
                {i18next.t("permissions.add-keys.import.success-description")}
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

export function SetupExternalImport({ onBack }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  if (!username) {
    return (
      <div className="text-center py-8 text-gray-500">
        {i18next.t("wallet.setup-external.import-login-required")}
      </div>
    );
  }

  return <SetupExternalImportInner username={username} onBack={onBack} />;
}
