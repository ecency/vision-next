import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import { OrDivider } from "@/features/shared";
import { UserItem } from "@/features/shared/login/user-item";
import { getAuthUrl } from "@/utils";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginByKey } from "./hooks";

interface Props {
  userListRef?: any;
}

export function Login({ userListRef }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);
  const users = useGlobalStore((state) => state.users);
  const hasKeyChain = useGlobalStore((state) => state.hasKeyChain);

  const [username, setUsername] = useState("");
  const [key, setKey] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const { mutateAsync: loginByKey } = useLoginByKey(username, key, isVerified);

  const router = useRouter();

  const usernameChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: username } = e.target;
    setUsername(username.trim().toLowerCase());
  };

  const keyChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: key } = e.target;
    setKey(key.trim());
  };

  const inputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      loginByKey().then();
    }
  };

  const hsLogin = () =>
    (window.location.href = getAuthUrl(EcencyConfigManager.CONFIG.service.hsClientId));
  const kcLogin = () => toggleUIProp("loginKc");

  const captchaCheck = (value: string | null) => {
    if (value) {
      setIsVerified(true);
    }
  };

  const spinner = <Spinner className="mr-[6px] w-3.5 h-3.5" />;

  return (
    <>
      {users.length === 0 && (
        <div className="dialog-header flex flex-col items-center justify-center">
          <Image width={100} height={100} src="/assets/logo-circle.svg" alt="Logo" />
          <h2>{i18next.t("login.title")}</h2>
        </div>
      )}

      {users.length > 0 && (
        <>
          <div className="user-list" ref={userListRef}>
            <div className="user-list-header">{i18next.t("g.login-as")}</div>
            <div className="user-list-body">
              {users.map((u) => (
                <UserItem
                  key={u.username}
                  disabled={inProgress}
                  user={u}
                  containerRef={userListRef}
                />
              ))}
            </div>
          </div>
          <OrDivider />
        </>
      )}

      <Form
        className="login-form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
        }}
      >
        <p className="login-form-text mb-4">{i18next.t("login.with-user-pass")}</p>
        <div className="mb-4">
          <FormControl
            type="text"
            value={username}
            onChange={usernameChanged}
            placeholder={i18next.t("login.username-placeholder")}
            autoFocus={true}
            onKeyDown={inputKeyDown}
          />
        </div>
        <div className="mb-4">
          <FormControl
            type="password"
            value={key}
            autoComplete="off"
            onChange={keyChanged}
            placeholder={i18next.t("login.key-placeholder")}
            onKeyDown={inputKeyDown}
          />
        </div>
        <div className="google-recaptcha">
          <ReCAPTCHA
            sitekey="6LdEi_4iAAAAAO_PD6H4SubH5Jd2JjgbIq8VGwKR"
            onChange={captchaCheck}
            size="normal"
          />
        </div>
        <p className="login-form-text my-3">
          {i18next.t("login.login-info-1")}{" "}
          <a
            onClick={(e) => {
              e.preventDefault();
              toggleUIProp("login");
              router.push("/faq#how-to-signin");
              setTimeout(() => {
                const el = document.getElementById("how-to-signin");
                if (el) el.scrollIntoView();
              }, 300);
            }}
            href="#"
          >
            {i18next.t("login.login-info-2")}
          </a>
        </p>
        <Button
          full={true}
          disabled={inProgress || !isVerified}
          className="block"
          onClick={() => loginByKey()}
        >
          {inProgress && username && key && spinner}
          {i18next.t("g.login")}
        </Button>
      </Form>
      <OrDivider />
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
    </>
  );
}
