import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { getAuthUrl } from "@/utils";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
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
import { DetectedExtension, getDetectedExtensions } from "@/utils/hive-extensions";

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

  const handleExtensionLogin = () => {
    if (isLoginByKeychainPending) {
      return;
    }
    loginByKeychain().catch(() => {
      /* Already handled in onError of the mutation */
    });
  };

  const [detectedExtensions, setDetectedExtensions] = useState<DetectedExtension[]>([]);
  const [useKeychainMobile, setUseKeychainMobile] = useState(false);

  useEffect(() => {
    setDetectedExtensions(getDetectedExtensions());
    setUseKeychainMobile(shouldUseKeychainMobile());
  }, []);

  const hasExtensions = detectedExtensions.length > 0 || useKeychainMobile;
  const extensionLabel = detectedExtensions.length > 0
    ? i18next.t("login.extensions")
    : useKeychainMobile
      ? i18next.t("login.keychain-mobile")
      : i18next.t("login.extensions");

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

            {hasExtensions && (
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
                        src="/assets/keychain.png"
                        alt="extensions"
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                }
              >
                {extensionLabel}
              </Button>
            )}

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
    </div>
  );
}
