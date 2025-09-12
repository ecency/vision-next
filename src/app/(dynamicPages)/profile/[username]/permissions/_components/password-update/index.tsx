"use client";

import { formatError } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { error, success } from "@/features/shared";
import { handleInvalid, handleOnInput, random } from "@/utils";
import { useAccountUpdatePassword } from "@ecency/sdk";
import { cryptoUtils } from "@hiveio/dhive";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import base58 from "bs58";
import i18next from "i18next";
import React, { useRef, useState } from "react";
import "./_index.scss";

interface Props {
  onUpdate?: () => void;
}

export function PasswordUpdate({ onUpdate }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const { mutateAsync: update, isPending } = useAccountUpdatePassword(activeUser?.username!, {
    onSuccess() {
      success(i18next.t("password-update.updated"));
      onUpdate?.();
    },
    onError(e) {
      error(...formatError(e));
    }
  });

  return (
    <div>
      <Form
        ref={formRef}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          e.stopPropagation();

          if (!formRef.current?.checkValidity()) {
            return;
          }

          if (newPass !== newPass2) {
            error(i18next.t("password-update.error-new2"));
            return;
          }

          update({ newPassword: newPass, currentPassword: curPass });
        }}
      >
        <div className="mb-4">
          <label>{i18next.t("password-update.account")}</label>
          <FormControl type="text" readOnly={true} value={activeUser?.username} />
        </div>
        <div className="mb-4">
          <label>{i18next.t("password-update.cur-pass")}</label>
          <FormControl
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            required={true}
            onInvalid={(e: any) => handleInvalid(e, "password-update.", "validation-password")}
            onInput={handleOnInput}
            type="password"
            autoFocus={true}
            autoComplete="off"
          />
        </div>
        <div className="mb-4">
          <label>{i18next.t("password-update.new-pass")}</label>
          <div>
            {!newPass && (
              <Button
                outline={true}
                onClick={() => {
                  setNewPass("P" + base58.encode(cryptoUtils.sha256(random())));
                }}
              >
                {i18next.t("password-update.pass-gen")}
              </Button>
            )}
            {newPass && <code className="pass-generated">{newPass}</code>}
          </div>
        </div>
        <div className="mb-4">
          <label>{i18next.t("password-update.new-pass2")}</label>
          <FormControl
            value={newPass2}
            onChange={(e) => setNewPass2(e.target.value)}
            required={true}
            type="password"
            autoComplete="off"
            onInvalid={(e: any) => handleInvalid(e, "password-update.", "validation-password")}
            onInput={handleOnInput}
          />
        </div>
        <div className="mb-4">
          <FormControl
            checked={false}
            required={true}
            type="checkbox"
            label={i18next.t("password-update.label-check")}
            onInvalid={(e: any) => handleInvalid(e, "password-update.", "validation-label")}
            onChange={handleOnInput}
          />
        </div>
        <Button type="submit" isLoading={isPending}>
          {i18next.t("g.update")}
        </Button>
      </Form>
    </div>
  );
}
