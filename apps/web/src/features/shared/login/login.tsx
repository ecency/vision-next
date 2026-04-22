import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { getAuthUrl } from "@/utils";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLoginByKeychain, useLoginByMetaMask } from "./hooks";
import { LoginUserByKey } from "./login-user-by-key";
import { LoginUsersList } from "./login-users-list";
import { motion } from "framer-motion";
import { TabItem } from "@/features/ui";
import clsx from "clsx";
import { shouldUseKeychainMobile } from "@/utils/client";
import { DetectedExtension, HiveExtensionId, getDetectedExtensions, getPreferredExtensionId, setPreferredExtensionId } from "@/utils/hive-extensions";

export default function Login() {
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const [step, setStep] = useState<"start" | "key">("start");
  const [username, setUsername] = useState("");
  const [currentTab, setCurrentTab] = useState("login");
  const [tabs] = useState([
    {
      title: i18next.t("login.my-users"),
      name: "users",
      key: "users"
    },
    {
      title: i18next.t("login.sign-in"),
      name: "login",
      key: "login"
    }
  ]);

  const hsLogin = () =>
    (window.location.href = getAuthUrl(EcencyConfigManager.CONFIG.service.hsClientId));

  const {
    mutateAsync: loginByKeychain,
    isPending: isLoginByKeychainPending
  } = useLoginByKeychain(username);

  const {
    mutateAsync: loginByMetaMask,
    isPending: isLoginByMetaMaskPending
  } = useLoginByMetaMask(username);

  const [detectedExtensions, setDetectedExtensions] = useState<DetectedExtension[]>([]);
  const [useKeychainMobile, setUseKeychainMobile] = useState(false);
  const [showExtensionsInfo, setShowExtensionsInfo] = useState(false);

  useEffect(() => {
    setDetectedExtensions(getDetectedExtensions());
    setUseKeychainMobile(shouldUseKeychainMobile());
  }, []);

  const hasExtensions = detectedExtensions.length > 0 || useKeychainMobile;
  const extensionLabel = detectedExtensions.length > 0
    ? i18next.t("login.extensions")
    : hasExtensions
      ? i18next.t("login.keychain-mobile")
      : i18next.t("login.extensions");

  const handleExtensionLogin = () => {
    if (!hasExtensions) {
      setShowExtensionsInfo(true);
      return;
    }
    if (detectedExtensions.length > 1) {
      // If a saved preference matches a detected extension, use it directly
      const savedId = getPreferredExtensionId();
      if (!savedId || !detectedExtensions.some((ext) => ext.id === savedId)) {
        setShowExtensionsInfo(true);
        return;
      }
    }
    if (isLoginByKeychainPending) {
      return;
    }
    loginByKeychain().catch(() => {
      /* Already handled in onError of the mutation */
    });
  };

  const handleSelectExtension = (extId: HiveExtensionId) => {
    setPreferredExtensionId(extId);
    setShowExtensionsInfo(false);
    if (isLoginByKeychainPending || !username) return;
    loginByKeychain().catch(() => {});
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4">
      <div className="md:hidden -mx-4 border-b border-[--border-color] grid grid-cols-3 items-center text-center text-sm font-semibold">
        {tabs.map((tab, i) => (
          <TabItem
            isSelected={tab.key === currentTab}
            key={tab.key}
            name={tab.key}
            onSelect={() => setCurrentTab(tab.key)}
            title={tab.title}
            i={i}
          />
        ))}
      </div>

      <LoginUsersList showOnMobile={currentTab === "users"} />

      <div
        className={clsx(
          "flex-col items-start gap-4",
          currentTab === "login" ? "flex" : "hidden md:flex"
        )}
      >
        {step === "key" && (
          <Button
            iconPlacement="left"
            onClick={() => setStep("start")}
            appearance="gray-link"
            size="sm"
            noPadding={true}
            icon={<UilArrowLeft />}
          >
            {i18next.t("g.back")}
          </Button>
        )}

        {step === "start" && (
          <div className="text-xs uppercase font-bold opacity-50 w-full mt-4">
            {i18next.t("login.write-username")}
          </div>
        )}
        <FormControl
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
          placeholder={i18next.t("login.username-placeholder")}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.code === "Enter" && !!username) {
              setStep("key");
            }
          }}
        />

        {step === "key" && <LoginUserByKey username={username} />}

        {step === "start" && (
          <motion.div
            className="grid grid-cols-2 gap-4 w-full"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              disabled={!username}
              full={true}
              size="lg"
              icon={<UilArrowRight />}
              className="mt-8 col-span-2"
              onClick={() => !!username && setStep("key")}
            >
              {i18next.t("login.continue-with-key")}
            </Button>

            <Button
              outline={true}
              onClick={hsLogin}
              size="lg"
              full={true}
              appearance="hivesigner"
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
              Hivesigner
            </Button>

            <Button
              appearance="secondary"
              outline={true}
              full={true}
              size="lg"
              onClick={() => !!username && handleExtensionLogin()}
              disabled={!username || isLoginByKeychainPending}
              isLoading={isLoginByKeychainPending}
              icon={
                <div className="flex items-center -space-x-1">
                  {detectedExtensions.length > 0 ? (
                    detectedExtensions.map((ext) => (
                      <Image
                        key={ext.id}
                        width={20}
                        height={20}
                        src={ext.icon}
                        alt={ext.name}
                        className="w-4 h-4 rounded-sm"
                      />
                    ))
                  ) : (
                    <Image
                      width={20}
                      height={20}
                      src="/assets/keeper.svg"
                      alt="extensions"
                      className="w-4 h-4"
                    />
                  )}
                </div>
              }
            >
              {extensionLabel}
            </Button>

            {typeof window !== "undefined" && window.ethereum?.isMetaMask && (
              <Button
                appearance="secondary"
                outline={true}
                full={true}
                size="lg"
                className="col-span-2"
                onClick={() => !!username && loginByMetaMask()}
                disabled={!username || isLoginByMetaMaskPending}
                isLoading={isLoginByMetaMaskPending}
                icon={
                  <Image
                    width={100}
                    height={100}
                    src="/assets/metamask-fox.svg"
                    alt="metamask"
                    className="w-4 h-4"
                  />
                }
              >
                {i18next.t("key-or-hot.sign-with-metamask", { defaultValue: "Sign with MetaMask" })}
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <div className="md:col-span-2 text-sm text-center my-4">
        {i18next.t("login.sign-up-text-1")}
        &nbsp;
        <Link
          href="/signup"
          onClick={() => {
            toggleUIProp("login");
          }}
        >
          {i18next.t("login.sign-up-text-2")}
        </Link>
      </div>

      <Modal show={showExtensionsInfo} centered={true} onHide={() => setShowExtensionsInfo(false)}>
        <ModalHeader closeButton={true}>
          <ModalTitle>
            {detectedExtensions.length > 1
              ? i18next.t("login.extensions-select-title")
              : i18next.t("login.extensions-info-title")}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {detectedExtensions.length > 1 ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {i18next.t("login.extensions-select-description")}
              </p>
              <div className="flex flex-col gap-3">
                {detectedExtensions.map((ext) => (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => handleSelectExtension(ext.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left w-full"
                  >
                    <Image width={32} height={32} src={ext.icon} alt={ext.name} className="w-8 h-8 rounded" />
                    <div className="flex-1 font-semibold text-sm">{ext.name}</div>
                    <UilArrowRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {i18next.t("login.extensions-info-description")}
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://chromewebstore.google.com/detail/hive-keeper/eehlplhgiofbbanbjiodipefljadfehe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Image width={32} height={32} src="/assets/keeper.svg" alt="Hive Keeper" className="w-8 h-8" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{i18next.t("login.extension-keeper-name")}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{i18next.t("login.extension-keeper-desc")}</div>
                  </div>
                  <UilArrowRight className="w-4 h-4 text-blue-500" />
                </a>
                <a
                  href="https://chromewebstore.google.com/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Image width={32} height={32} src="/assets/keychain.png" alt="Keychain" className="w-8 h-8" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{i18next.t("login.extension-keychain-name")}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{i18next.t("login.extension-keychain-desc")}</div>
                  </div>
                  <UilArrowRight className="w-4 h-4 opacity-50" />
                </a>
                <a
                  href="https://chromewebstore.google.com/detail/peak-vault/mcocapccicdidkhhghnopbddglkpjcoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Image width={32} height={32} src="/assets/peakvault.svg" alt="Peak Vault" className="w-8 h-8" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{i18next.t("login.extension-peakvault-name")}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{i18next.t("login.extension-peakvault-desc")}</div>
                  </div>
                  <UilArrowRight className="w-4 h-4 opacity-50" />
                </a>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
