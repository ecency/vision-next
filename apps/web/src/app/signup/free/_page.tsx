"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { Spinner } from "@ui/spinner";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import useDebounce from "react-use/lib/useDebounce";
import { useLocalStorage, useMount } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import i18next from "i18next";
import { getAccountsQueryOptions, signUp } from "@ecency/sdk";
import { error } from "@/features/shared/feedback";
import { getUsernameError, handleInvalid, handleOnInput } from "@/utils";
import { checkSvg } from "@ui/svg";
import { useGlobalStore } from "@/core/global-store";
import { useQueryClient } from "@tanstack/react-query";

export function FreeSignUp() {
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const queryClient = useQueryClient();

  const [lsReferral, setLsReferral] = useLocalStorage<string>(PREFIX + "_referral");

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [referralTouched, setReferralTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [referral, setReferral] = useState("");
  const [lockReferral, setLockReferral] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [done, setDone] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const form = useRef<HTMLFormElement>(null);

  const params = useSearchParams();
  const router = useRouter();

  useMount(() => {
    const referral = params?.get("referral");
    if (referral && typeof referral === "string") {
      setReferral(referral);
      setLockReferral(true);
      setLsReferral(referral);
    } else if (lsReferral && typeof lsReferral === "string") {
      router.push(`/signup/free?referral=${lsReferral}`);
      setReferral(lsReferral);
    }
  });

  useEffect(() => {
    if (!username && !usernameTouched) return;

    const errorMsg = getUsernameError(username);
    setUsernameError(errorMsg || "");
    setIsDisabled(!!errorMsg);
  }, [username, usernameTouched]);

  useDebounce(
    () => {
      if (username?.length >= 3 && username.length <= 16) {
        queryClient.fetchQuery(getAccountsQueryOptions([username])).then((r) => {
          if (r.length > 0) {
            setUsernameError(i18next.t("sign-up.username-exists"));
            setIsDisabled(true);
          }
        });
      }
    },
    1000,
    [username]
  );

  useEffect(() => {
    if (email.length > 72) {
      setEmailError(i18next.t("sign-up.email-max-length-error"));
    } else {
      setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    setReferralError("");
    setIsDisabled(false);

    if (!referral) {
      return;
    }
    if (referral.length > 16) {
      setReferralError(i18next.t("sign-up.referral-max-length-error"));
      setIsDisabled(true);
    } else {
      referral.split(".").some((item) => {
        if (item.length < 3) {
          setReferralError(i18next.t("sign-up.referral-min-length-error"));
          setIsDisabled(true);
          return true;
        }
        return false;
      });
    }
  }, [referral, referralTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.current?.checkValidity()) {
      return;
    }

    if (usernameError || referralError || emailError) {
      return;
    }

    try {
      const existingAccount = await queryClient.fetchQuery(
        getAccountsQueryOptions([username])
      );
      if (existingAccount.length > 0) {
        setUsernameError(i18next.t("sign-up.username-exists"));
        return;
      }

      if (referral) {
        const referralIsValid = await queryClient.fetchQuery(
          getAccountsQueryOptions([referral])
        );
        if (referralIsValid.length === 0) {
          setReferralError(i18next.t("sign-up.referral-invalid"));
          return;
        }
      }
    } catch {
      error(i18next.t("g.server-error"));
      return;
    }

    setInProgress(true);
    try {
      if (!isVerified) {
        error(i18next.t("login.captcha-check-required"));
        return;
      }

      const response = await signUp(username, email, referral);
      if (response?.data?.code) {
        setRegistrationError(String(response.data.code));
      } else {
        setDone(true);
        setLsReferral(undefined);
      }
    } catch (e) {
      if (e instanceof Error && "data" in e) {
        const errorData = (e as { data?: { message?: string } }).data;
        if (errorData?.message) {
          setRegistrationError(errorData.message);
        }
      }
    } finally {
      setInProgress(false);
    }
  };

  const captchaCheck = (value: string | null) => {
    setIsVerified(!!value);
  };

  return (
    <div className="max-w-[500px] mx-auto">
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-2">{i18next.t("signup-options.free.title")}</h2>
        <p className="opacity-60 mb-6">{i18next.t("sign-up.free-account-desc")}</p>

        {done ? (
          <div className="text-center bg-blue-dark-sky-040 rounded-2xl p-6">
            <div className="w-10 h-10 mx-auto mb-4 bg-blue-dark-sky rounded-full text-white flex items-center justify-center">
              {checkSvg}
            </div>
            <div className="text-blue-dark-sky">
              <p>{i18next.t("sign-up.success", { email })}</p>
              <p>{i18next.t("sign-up.success-2")}</p>
            </div>
          </div>
        ) : (
          <>
            <Form
              ref={form}
              onSubmit={handleSubmit}
            >
              <div className="mb-4">
                <FormControl
                  type="text"
                  placeholder={i18next.t("sign-up.username")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  autoFocus={true}
                  required={true}
                  onInvalid={(e: any) => handleInvalid(e, "sign-up.", "validation-username")}
                  aria-invalid={usernameError !== ""}
                  onInput={handleOnInput}
                  onBlur={() => setUsernameTouched(true)}
                />
                <small className="text-red pl-3">{usernameError}</small>
              </div>
              <div className="mb-4">
                <FormControl
                  type="email"
                  placeholder={i18next.t("sign-up.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={true}
                  onInvalid={(e: any) => handleInvalid(e, "sign-up.", "validation-email")}
                  aria-invalid={emailError !== ""}
                  onInput={handleOnInput}
                />
                <small className="text-red pl-3">{emailError}</small>
              </div>
              <div className="mb-4">
                <FormControl
                  type="text"
                  placeholder={i18next.t("sign-up.ref")}
                  value={referral}
                  onChange={(e) => setReferral(e.target.value.toLowerCase())}
                  disabled={lockReferral}
                  aria-invalid={referralError !== ""}
                  onBlur={() => setReferralTouched(true)}
                />
                <small className="text-red pl-3">{referralError}</small>
              </div>
              <div className="my-4">
                <ReCAPTCHA
                  sitekey="6LdEi_4iAAAAAO_PD6H4SubH5Jd2JjgbIq8VGwKR"
                  onChange={captchaCheck}
                  size="normal"
                />
              </div>
              {registrationError && (
                <div className="text-red-020 text-sm mb-4 px-3">{registrationError}</div>
              )}
              <Button
                className="w-full"
                type="submit"
                disabled={
                  inProgress ||
                  !isVerified ||
                  isDisabled ||
                  !!usernameError ||
                  !!emailError ||
                  !!referralError
                }
                icon={inProgress && <Spinner className="w-3.5 h-3.5" />}
                iconPlacement="left"
              >
                {i18next.t("sign-up.register-free")}
              </Button>
            </Form>
            <div className="text-center mt-4">
              {i18next.t("sign-up.login-text-1")}
              <button type="button" className="pl-1 cursor-pointer" onClick={() => toggleUIProp("login")}>
                {i18next.t("sign-up.login-text-2")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
