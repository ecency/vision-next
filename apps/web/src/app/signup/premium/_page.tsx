"use client";

import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import useDebounce from "react-use/lib/useDebounce";
import { useLocalStorage, useMount } from "react-use";
import { PREFIX } from "@/utils/local-storage";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import i18next from "i18next";
import { getAccountsQueryOptions } from "@ecency/sdk";
import { getUsernameError, handleInvalid, handleOnInput } from "@/utils";
import { appleSvg, googleSvg } from "@ui/svg";
import { useGlobalStore } from "@/core/global-store";
import { useQueryClient } from "@tanstack/react-query";
import qrcode from "qrcode";

export function PremiumSignUp() {
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
  const [isDisabled, setIsDisabled] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

  const form = useRef<HTMLFormElement>(null);
  const qrCodeRef = useRef<HTMLImageElement>(null);

  const params = useSearchParams();
  const router = useRouter();

  useMount(() => {
    const referral = params?.get("referral");
    if (referral && typeof referral === "string") {
      setReferral(referral);
      setLockReferral(true);
      setLsReferral(referral);
    } else if (lsReferral && typeof lsReferral === "string") {
      router.push(`/signup/premium?referral=${lsReferral}`);
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

  useEffect(() => {
    if (showPayment && paymentUrl && qrCodeRef.current) {
      qrcode.toDataURL(paymentUrl, { width: 300 }).then((src) => {
        if (qrCodeRef.current) {
          qrCodeRef.current.src = src;
        }
      });
    }
  }, [showPayment, paymentUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.current?.checkValidity()) {
      return;
    }

    if (usernameError || referralError || emailError) {
      return;
    }

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

    const url = new URL("https://ecency.com");
    url.pathname = "purchase";
    const urlParams = new URLSearchParams();
    urlParams.set("username", username);
    urlParams.set("email", email);
    urlParams.set("referral", referral);
    urlParams.set("type", "account");
    url.search = urlParams.toString();

    setPaymentUrl(url.toString());
    setShowPayment(true);
  };

  return (
    <div className="max-w-[500px] mx-auto">
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-2">{i18next.t("signup-options.premium.title")}</h2>
        <p className="opacity-60 mb-4">{i18next.t("sign-up.buy-account-desc")}</p>

        <ul className="list-disc pl-5 mb-6 text-sm opacity-75 space-y-1">
          <li>{i18next.t("sign-up.buy-account-li-1")}</li>
          <li>{i18next.t("sign-up.buy-account-li-2")}</li>
          <li>{i18next.t("sign-up.buy-account-li-3")}</li>
        </ul>

        {!showPayment ? (
          <>
            <Form ref={form} onSubmit={handleSubmit}>
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
              <Button
                className="w-full"
                type="submit"
                disabled={
                  isDisabled ||
                  !!usernameError ||
                  !!emailError ||
                  !!referralError
                }
              >
                {i18next.t("sign-up.buy-account")} — $2.99
              </Button>
            </Form>
            <div className="text-center mt-4">
              {i18next.t("sign-up.login-text-1")}
              <a className="pl-1 cursor-pointer" onClick={() => toggleUIProp("login")}>
                {i18next.t("sign-up.login-text-2")}
              </a>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col justify-center">
            <div className="my-3 text-center">{i18next.t("sign-up.qr-desc")}</div>
            <a href={paymentUrl}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" width={300} height={300} ref={qrCodeRef} className="rounded-xl" />
            </a>
            <div className="flex flex-col my-4 gap-4 sm:flex-row">
              <a href="https://ios.ecency.com" className="flex items-center gap-2 bg-gray-100 dark:bg-dark-default hover:bg-gray-200 dark:hover:bg-black rounded-lg px-3 py-2" target="_blank" rel="noopener noreferrer">
                <span className="w-8 h-8">{appleSvg}</span>
                <span>
                  <span className="text-xs block opacity-75">Download on the</span>
                  <span className="font-semibold">AppStore</span>
                </span>
              </a>
              <a href="https://android.ecency.com" className="flex items-center gap-2 bg-gray-100 dark:bg-dark-default hover:bg-gray-200 dark:hover:bg-black rounded-lg px-3 py-2" target="_blank" rel="noopener noreferrer">
                <span className="w-8 h-8">{googleSvg}</span>
                <span>
                  <span className="text-xs block opacity-75">Get it on</span>
                  <span className="font-semibold">GooglePlay</span>
                </span>
              </a>
            </div>
            <Button appearance="gray" onClick={() => setShowPayment(false)}>
              {i18next.t("g.back")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
