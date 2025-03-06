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
  const kcLogin = () => toggleUIProp("loginKc");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4">
      <LoginUsersList loginInProgress={inProgress} />

      <div>
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

        <div className="hs-login">
          <Button
            outline={true}
            onClick={hsLogin}
            disabled={inProgress}
            icon={
              <Image
                width={100}
                height={100}
                src="/assets/hive-signer.svg"
                className="hs-logo"
                alt="hivesigner"
              />
            }
            iconPlacement="left"
          >
            {i18next.t("login.with-hive-signer")}
          </Button>
        </div>
        {hasKeyChain && (
          <div className="kc-login">
            <Button
              outline={true}
              onClick={kcLogin}
              disabled={inProgress}
              icon={
                <Image
                  width={100}
                  height={100}
                  src="/assets/keychain.png"
                  className="kc-logo"
                  alt="keychain"
                />
              }
              iconPlacement="left"
            >
              {i18next.t("login.with-keychain")}
            </Button>
          </div>
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
