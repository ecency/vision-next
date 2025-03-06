import React, { useEffect, useState } from "react";
import { Spinner } from "@ui/spinner";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Account } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { getAccountFullQuery } from "@/api/queries";
import i18next from "i18next";
import { addAccountAuthority, generateKeys, makeHsCode, signBuffer } from "@/utils";
import { formatError } from "@/api/operations";
import { error } from "@/features/shared";
import Image from "next/image";
import { EcencyConfigManager } from "@/config";
import { useLoginInApp } from "./hooks";

export function LoginKc() {
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const [username, setUsername] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const { data: account, isError: isAccountFetchingError } =
    getAccountFullQuery(username).useClientQuery();

  const loginInApp = useLoginInApp(username);

  useEffect(() => {
    if (account) {
      if (account.name !== username) {
        error(i18next.t("login.error-user-not-found"));
        return;
      }
    }
  }, [account, username]);

  useEffect(() => {
    if (isAccountFetchingError) {
      error(i18next.t("login.error-user-fetch"));
    }
  }, [isAccountFetchingError]);

  const signer = (message: string): Promise<string> =>
    signBuffer(username, message, "Posting").then((r) => r.result);

  const login = async () => {
    if (!account) {
      return;
    }

    setInProgress(true);

    const hasPostingPerm =
      account.posting!.account_auths.filter(
        (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
      ).length > 0;

    if (!hasPostingPerm) {
      const weight = account.posting!.weight_threshold;

      setInProgress(true);
      try {
        await addAccountAuthority(
          username,
          EcencyConfigManager.CONFIG.service.hsClientId,
          "Posting",
          weight
        );
      } catch (err) {
        error(i18next.t("login.error-permission"));
        return;
      } finally {
        setInProgress(false);
      }
    }

    setInProgress(true);

    let code: string;
    try {
      code = await makeHsCode(EcencyConfigManager.CONFIG.service.hsClientId, username, signer);

      await loginInApp(code, null, account!);
    } catch (err) {
      error(...formatError(err));
      setInProgress(false);
      return;
    }
  };

  const inputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      login().then();
    }
  };

  const back = () => toggleUIProp("loginKc");
  const spinner = <Spinner className="mr-[6px] w-3.5 h-3.5" />;

  return (
    <>
      <div className="dialog-header flex flex-col  items-center justify-center">
        <Image
          width={100}
          height={100}
          src="/assets/keychain.png"
          className="w-[100px] min-h-[100px]"
          alt="Logo"
        />
        <h2>{i18next.t("login.with-keychain")}</h2>
      </div>

      <Form className="login-form" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
        <div className="mb-4">
          <FormControl
            type="text"
            value={username}
            onChange={(e) => {
              const { value: username } = e.target;
              setUsername(username.trim().toLowerCase());
            }}
            placeholder={i18next.t("login.username-placeholder")}
            autoFocus={true}
            onKeyDown={inputKeyDown}
          />
        </div>
        <div className="flex items-center justify-center flex-wrap gap-4 my-4">
          <Button disabled={inProgress} className="block" onClick={login}>
            {inProgress && spinner}
            {i18next.t("g.login")}
          </Button>
          <Button outline={true} className="block" disabled={inProgress} onClick={back}>
            {i18next.t("g.back")}
          </Button>
        </div>
      </Form>
    </>
  );
}
