import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { getAuthUrl } from "@/utils";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { LoginUserByKey } from "./login-user-by-key";
import { LoginUsersList } from "./login-users-list";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { useLoginByKeychain } from "./hooks";

export function Login() {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);
  const hasKeyChain = useGlobalStore((state) => state.hasKeyChain);

  const [step, setStep] = useState<"start" | "key">("start");
  const [username, setUsername] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const router = useRouter();

  const hsLogin = () =>
    (window.location.href = getAuthUrl(EcencyConfigManager.CONFIG.service.hsClientId));

  const { mutateAsync: loginByKeychain, isPending: isLoginByKeychainPending } =
    useLoginByKeychain(username);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4">
      <LoginUsersList loginInProgress={inProgress} />

      <div className="flex flex-col gap-4">
        <div>
          {step === "key" && (
            <Button
              iconPlacement="left"
              onClick={() => setStep("start")}
              appearance="gray-link"
              size="sm"
              icon={<UilArrowLeft />}
            >
              {i18next.t("g.back")}
            </Button>
          )}

          {step === "start" && (
            <div className="w-full text-gray-600 dark:text-gray-400">
              {i18next.t("login.write-username")}
            </div>
          )}
          <FormControl
            className="my-4"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
            placeholder={i18next.t("login.username-placeholder")}
            autoFocus={true}
          />

          {step === "start" && (
            <Button
              disabled={!username}
              full={true}
              size="lg"
              icon={<UilArrowRight />}
              onClick={() => !!username && setStep("key")}
            >
              {i18next.t("login.continue-with-key")}
            </Button>
          )}
          {step === "key" && <LoginUserByKey username={username} />}
        </div>

        <Button
          outline={true}
          onClick={hsLogin}
          size="lg"
          full={true}
          disabled={inProgress}
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
          {i18next.t("login.with-hive-signer")}
        </Button>

        {hasKeyChain && (
          <Button
            appearance="secondary"
            full={true}
            size="lg"
            onClick={() => !!username && loginByKeychain()}
            disabled={!username}
            isLoading={isLoginByKeychainPending}
            icon={
              <Image
                width={100}
                height={100}
                src="/assets/keychain.png"
                alt="keychain"
                className="w-4 h-4"
              />
            }
          >
            {i18next.t("login.with-keychain")}
          </Button>
        )}
        {activeUser === null && (
          <p>
            {i18next.t("login.sign-up-text-1")}
            &nbsp;
            <a
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                toggleUIProp("login");
                router.push("/signup");
              }}
            >
              {i18next.t("login.sign-up-text-2")}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
