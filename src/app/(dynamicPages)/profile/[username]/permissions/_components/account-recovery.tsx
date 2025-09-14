"use client";

import React, { useState } from "react";
import useDebounce from "react-use/lib/useDebounce";
import { PrivateKey } from "@hiveio/dhive";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { FullAccount } from "@/entities";
import { addRecoveries, getRecoveries } from "@/api/private-api";
import { useGlobalStore } from "@/core/global-store";
import { findAccountRecoveryRequest, getAccount } from "@/api/hive";
import i18next from "i18next";
import { error, KeyOrHot, LinearProgress, UserAvatar } from "@/features/shared";
import { PopoverConfirm } from "@ui/index";
import { arrowRightSvg } from "@ui/svg";
import {
  changeRecoveryAccount,
  changeRecoveryAccountHot,
  changeRecoveryAccountKc,
  formatError
} from "@/api/operations";
import useMount from "react-use/lib/useMount";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useClientActiveUser } from "@/api/queries";

const ECENCY = "ecency";

const schema = yup.object({
  isEcency: yup.boolean().optional(),
  newRecoveryAccount: yup
    .string()
    .required(i18next.t("validation.required"))
    .min(2, i18next.t("sign-up.username-max-length-error")),
  recoveryEmail: yup.string().when("isEcency", {
    is: true,
    then: (s) =>
      s.required(i18next.t("validation.required")).email(i18next.t("validation.invalid-email")),
    otherwise: (s) => s.optional()
  })
});

type FormValues = {
  newRecoveryAccount: string;
  recoveryEmail?: string;
  isEcency?: boolean;
};

export function AccountRecovery() {
  const activeUser = useClientActiveUser();

  const [keyDialog, setKeyDialog] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [isEcency, setIsEcency] = useState(false);
  const [popOver, setPopOver] = useState(false);
  const [step, setStep] = useState(1);
  const [toError, setToError] = useState("");
  const [accountData, setAccountData] = useState<FullAccount | undefined>();
  const [toWarning, setToWarning] = useState("");
  const [currRecoveryAccount, setCurrRecoveryAccount] = useState("");
  const [pendingRecoveryAccount, setPendingRecoveryAccount] = useState("");

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      newRecoveryAccount: "",
      recoveryEmail: "",
      isEcency: false
    },
    mode: "onChange"
  });

  const newRecoveryAccount = methods.watch("newRecoveryAccount");
  const recoveryEmail = methods.watch("recoveryEmail");
  const formErrors = methods.formState.errors;

  const fetchEmail = async () => {
    let response = await getRecoveries(activeUser?.username!);
    if (response[0]) {
      methods.setValue("recoveryEmail", response[0].email ?? "");
    }
  };

  useMount(() => {
    getCurrentAccount();
    fetchEmail();
  });

  const getCurrentAccount = async () => {
    const account = await getAccount(activeUser!.username);
    setAccountData(account);
    const { recovery_account } = account;
    setCurrRecoveryAccount(recovery_account);
    if (recovery_account === activeUser?.username) {
      setToWarning(i18next.t("account-recovery.same-recover-agent-suggestion"));
    }

    const resp = await findAccountRecoveryRequest(activeUser!.username);
    if (resp.requests.length) {
      setPendingRecoveryAccount(resp.requests[0].recovery_account);
      setPopOver(true);
    }

    if (recovery_account === ECENCY) {
      setIsEcency(true);
      setPopOver(false);
    }
  };

  const toggleKeyDialog = () => {
    setKeyDialog(!keyDialog);
    finish();
  };

  useDebounce(
    async () => {
      const value = newRecoveryAccount;
      if (!value) {
        setDisabled(true);
        setToError("");
        return;
      }

      const resp = await getAccount(value);
      if (resp) {
        const isECENCY = value === ECENCY;
        if (isECENCY) {
          setDisabled(true);
          return;
        } else if (pendingRecoveryAccount) {
          setPopOver(true);
        }

        if (value === activeUser?.username) {
          setDisabled(true);
          setToError(i18next.t("account-recovery.same-account-error"));
          return;
        }
        setDisabled(false);
        setToError("");
      } else {
        if (value.length > 0) {
          setDisabled(true);
          setToError(i18next.t("account-recovery.to-not-found"));
        }
      }
    },
    1000,
    [newRecoveryAccount]
  );

  const update = () => {
    if (!popOver && !isEcency) {
      setKeyDialog(true);
    } else {
      handleIsEcency();
    }
  };

  const handleIsEcency = async () => {
    setInProgress(true);
    if (isEcency) {
      await addRecoveries(activeUser?.username!, recoveryEmail, {
        public_keys: [
          ...accountData!.owner.key_auths,
          ...accountData!.active.key_auths,
          ...accountData!.posting.key_auths,
          accountData!.memo_key
        ]
      });
    }
    if (isEcency && currRecoveryAccount === ECENCY) {
      setKeyDialog(true);
      setStep(4);
    }
    setDisabled(true);
    setInProgress(false);
  };

  const onKey = async (key: PrivateKey) => {
    setInProgress(true);
    if (isEcency || currRecoveryAccount === ECENCY) {
      handleIsEcency();
    }

    try {
      let result = await changeRecoveryAccount(activeUser!.username, newRecoveryAccount, [], key);
      if (result.id) {
        setKeyDialog(true);
        setStep(3);
      }
    } catch (err) {
      error(...formatError(err));
    } finally {
      setInProgress(false);
    }
  };

  const onHot = () => {
    handleIsEcency();
    changeRecoveryAccountHot(activeUser!.username, newRecoveryAccount, []);
    setKeyDialog(false);
  };

  const onKc = () => {
    handleIsEcency();
    changeRecoveryAccountKc(activeUser!.username, newRecoveryAccount, []);
  };

  const back = () => {
    toggleKeyDialog();
  };

  const confirm = () => {
    setStep(2);
  };

  const finish = () => {
    setKeyDialog(false);
    methods.reset({ newRecoveryAccount: "", recoveryEmail: "" });
    setDisabled(true);
    setIsEcency(false);
    setToError("");
  };

  const handleConfirm = () => {
    setKeyDialog(true);
    setStep(1);
  };

  const handleRecoveryEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecoveryEmail(e.target.value);
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    setDisabled(!emailRegex.test(e.target.value));
  };

  const confirmationModal = () => {
    return (
      <div className="recovery-confirm-dialog">
        <div className="recovery-confirm-dialog-content">
          <div className="recovery-confirm-dialog-header">
            <div className="step-no">1</div>
            <div className="recovery-confirm-box-titles">
              <div className="recovery-main-title">
                {i18next.t("account-recovery.confirm-title")}
              </div>
              <div className="recovery-sub-title">
                {i18next.t("account-recovery.confirm-sub-title")}
              </div>
            </div>
          </div>
          <div className="recovery-confirm-dialog-body">
            <div className="confirmation">
              <div className="users">
                <div className="from-user">
                  <UserAvatar username={activeUser!.username} size="large" />
                </div>

                <>
                  <div className="arrow">{arrowRightSvg}</div>
                  <div className="to-user">
                    <UserAvatar username={newRecoveryAccount} size="large" />
                  </div>
                </>
              </div>
            </div>
            <div className="flex justify-center">
              <Button appearance="secondary" outline={true} onClick={back}>
                {i18next.t("g.back")}
              </Button>
              <span className="hr-6px-btn-spacer" />
              <Button onClick={confirm}>{i18next.t("transfer.confirm")}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const signkeyModal = () => {
    return (
      <>
        <div className="recovery-sign-dialog-header border-b border-[--border-color]">
          <div className="step-no">2</div>
          <div className="recovery-sign-dialog-titles">
            <div className="recovery-main-title">{i18next.t("account-recovery.sign-title")}</div>
            <div className="recovery-sub-title">{i18next.t("account-recovery.sign-sub-title")}</div>
          </div>
        </div>
        {inProgress && <LinearProgress />}
        <KeyOrHot
          inProgress={inProgress}
          onKey={onKey}
          onKc={() => {
            toggleKeyDialog();
            if (onKc) {
              onKc();
            }
          }}
          onHot={() => {
            toggleKeyDialog();
            if (onHot) {
              onHot();
            }
          }}
        />
        <p className="text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            {i18next.t("g.back")}
          </a>
        </p>
      </>
    );
  };

  const successModal = () => {
    return (
      <>
        <div className="recovery-success-dialog-header border-b border-[--border-color]">
          <div className="step-no">3</div>
          <div className="recovery-success-dialog-titles">
            <div className="recovery-main-title">{i18next.t("trx-common.success-title")}</div>
            <div className="recovery-sub-title">{i18next.t("trx-common.success-sub-title")}</div>
          </div>
        </div>

        <div className="recovery-success-dialog-body">
          <div className="recovery-success-dialog-content">
            <span> {i18next.t("account-recovery.success-message")}</span>
          </div>
          <div className="flex justify-center">
            <span className="hr-6px-btn-spacer" />
            <Button onClick={finish}>{i18next.t("g.finish")}</Button>
          </div>
        </div>
      </>
    );
  };

  const emailUpdateModal = () => {
    return (
      <>
        <div className="recovery-success-dialog-header border-b border-[--border-color]">
          <div className="step-no">1</div>
          <div className="recovery-success-dialog-titles">
            <div className="recovery-main-title">{i18next.t("trx-common.success-title")}</div>
            <div className="recovery-sub-title">
              {i18next.t("account-recovery.update-successful")}
            </div>
          </div>
        </div>

        <div className="recovery-success-dialog-body">
          <div className="recovery-success-dialog-content">
            <span> {i18next.t("account-recovery.update-success-message")}</span>
          </div>
          <div className="flex justify-center">
            <span className="hr-6px-btn-spacer" />
            <Button onClick={finish}>{i18next.t("g.finish")}</Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="rounded-xl bg-white bg-opacity-75">
      <div className="md:col-span-2 px-4 pt-4 pb-1 text-sm md:text-lg font-bold">
        {i18next.t("permissions.recovery.title")}
      </div>
      <div className="px-4 text-sm opacity-75 mb-4">{i18next.t("permissions.recovery.hint")}</div>
      <Form
        className="px-4 pb-4 block"
        onSubmit={methods.handleSubmit(() => {
          update();
        })}
      >
        <div className="mb-4">
          <label>{i18next.t("account-recovery.curr-recovery-acc")}</label>
          <FormControl type="text" readOnly={true} value={currRecoveryAccount} />
        </div>
        {toWarning && <small className="suggestion-info">{toWarning}</small>}
        <div className="mb-4">
          <label>{i18next.t("account-recovery.new-recovery-acc")}</label>
          <FormControl
            {...methods.register("newRecoveryAccount", {
              onChange: (e) => {
                const v = e.target.value as string;
                setIsEcency(v === ECENCY);
              }
            })}
            required={!isEcency}
            type="text"
            autoFocus={true}
            autoComplete="off"
            className={toError || formErrors.newRecoveryAccount ? "is-invalid" : ""}
            aria-invalid={!!(toError || formErrors.newRecoveryAccount)}
          />
        </div>
        {(toError || formErrors.newRecoveryAccount) && (
          <small className="error-info">
            {toError || formErrors.newRecoveryAccount?.message?.toString()}
          </small>
        )}
        {isEcency && (
          <div className="mb-4">
            <label>{i18next.t("account-recovery.new-recovery-email")}</label>
            <FormControl
              {...methods.register("recoveryEmail", {
                onChange: (e) => {
                  const val = e.target.value as string;
                  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                  setDisabled(!emailRegex.test(val));
                }
              })}
              required={true}
              type="text"
              placeholder={i18next.t("account-recovery.email-placeholder")}
              autoComplete="off"
              aria-invalid={!!formErrors.recoveryEmail}
              className={formErrors.recoveryEmail ? "is-invalid" : ""}
            />
            {formErrors.recoveryEmail && (
              <small className="error-info">{formErrors.recoveryEmail.message?.toString()}</small>
            )}
          </div>
        )}
        {inProgress && <LinearProgress />}

        {popOver ? (
          <div className="main">
            <PopoverConfirm
              placement="top"
              trigger="click"
              onConfirm={() => handleConfirm()}
              titleText={i18next.t("account-recovery.info-message", {
                n: pendingRecoveryAccount
              })}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Button disabled={disabled} type="submit">
                  {i18next.t("g.update")}
                </Button>
              </div>
            </PopoverConfirm>
          </div>
        ) : (
          <Button className="update-btn" disabled={disabled} type="submit">
            {i18next.t("g.update")}
          </Button>
        )}
      </Form>

      {keyDialog && (
        <Modal
          show={true}
          centered={true}
          onHide={toggleKeyDialog}
          className="recovery-dialog"
          size="lg"
        >
          <ModalHeader thin={true} closeButton={true} />
          <ModalBody>
            {step === 1 && confirmationModal()}
            {step === 2 && signkeyModal()}
            {step === 3 && successModal()}
            {step === 4 && emailUpdateModal()}
          </ModalBody>
        </Modal>
      )}
    </div>
  );
}
