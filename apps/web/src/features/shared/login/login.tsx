import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { getAuthUrl } from "@/utils";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLoginByKeychain } from "./hooks";
import { LoginUserByKey } from "./login-user-by-key";
import { LoginUsersList } from "./login-users-list";
import { motion } from "framer-motion";
import { TabItem } from "@/features/ui";
import clsx from "clsx";
import { shouldUseHiveAuth } from "@/utils/client";

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
    isPending: isLoginByKeychainPending,
    retryCountdown,
    isRetryScheduled: isLoginRetryScheduled,
    retryAttempt,
    maxAttempts
  } = useLoginByKeychain(username);

  const handleKeychainLogin = () => {
    if (isLoginByKeychainPending) {
      return;
    }
    loginByKeychain().catch(() => {
      /* Already handled in onError of the mutation */
    });
  };

  const useHiveAuth = shouldUseHiveAuth();
  const keychainMethodLabel = useHiveAuth ? "HiveAuth" : "Keychain";
  const keychainIcon = useHiveAuth ? "/assets/hive-auth.svg" : "/assets/keychain.png";
  const keychainAlt = useHiveAuth ? "hiveauth" : "keychain";

  const keychainButtonLabel = (() => {
    if (isLoginRetryScheduled && retryCountdown !== null) {
      return (
        <span className="flex items-center gap-1">
          <span>{keychainMethodLabel}</span>
          <span className="font-mono text-xs leading-none">
            {retryCountdown}
          </span>
          {retryAttempt > 0 ? (
            <span className="text-xs leading-none text-[--text-muted]">
              {retryAttempt}/{maxAttempts}
            </span>
          ) : null}
        </span>
      );
    }

    if (isLoginByKeychainPending && retryAttempt > 0) {
      return `${keychainMethodLabel} (${retryAttempt}/${maxAttempts})`;
    }

    return keychainMethodLabel;
  })();

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
              onClick={() => !!username && handleKeychainLogin()}
              disabled={!username || isLoginByKeychainPending}
              isLoading={isLoginByKeychainPending && !isLoginRetryScheduled}
              icon={
                <Image
                  width={100}
                  height={100}
                  src={keychainIcon}
                  alt={keychainAlt}
                  className="w-4 h-4"
                />
              }
            >
              {keychainButtonLabel}
            </Button>
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
