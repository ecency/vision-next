"use client";

import { Button } from "@ui/button";
import { FormControl, InputGroup } from "@ui/input";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import { LinearProgress } from "@/features/shared/linear-progress";
import { error } from "@/features/shared/feedback";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { b64uDec } from "@/utils";
import i18next from "i18next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getRcStatsQueryOptions,
  getDynamicPropsQueryOptions,
  onboardEmail
} from "@ecency/sdk";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { useCreateAccountMutation, useDelegateRcMutation } from "@/api/sdk-mutations";
import { formatError } from "@/api/format-error";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DecodedHash {
  username: string;
  email: string;
  referral?: string;
  pubkeys: {
    ownerPublicKey: string;
    activePublicKey: string;
    postingPublicKey: string;
    memoPublicKey: string;
  };
}

type ModalStep = "sign" | "success" | "failed" | null;

interface Props {
  hash: string;
}

export function InvitedSponsorPage({ hash }: Props) {
  const { activeUser, account } = useActiveAccount();
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const queryClient = useQueryClient();
  const { mutateAsync: createAccount, isPending: isCreatePending } =
    useCreateAccountMutation();
  const { mutateAsync: delegateRc } = useDelegateRcMutation();

  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [createOption, setCreateOption] = useState<"hive" | "credit">("hive");
  const [isChecked, setChecked] = useState(false);
  const [rcAmount, setRcAmount] = useState(0);
  const [rcError, setRcError] = useState("");
  const [commentAmount, setCommentAmount] = useState(0);
  const [voteAmount, setVoteAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [customJsonAmount, setCustomJsonAmount] = useState(0);

  const decodedInfo = useMemo<DecodedHash | null>(() => {
    try {
      const parsed = JSON.parse(b64uDec(hash));
      if (!parsed?.pubkeys?.ownerPublicKey) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [hash]);

  const accountCredit = account?.pending_claimed_accounts ?? 0;

  const confirmFields = decodedInfo
    ? [
        { label: i18next.t("onboard.username"), value: decodedInfo.username },
        {
          label: i18next.t("onboard.public-owner"),
          value: decodedInfo.pubkeys.ownerPublicKey
        },
        {
          label: i18next.t("onboard.public-active"),
          value: decodedInfo.pubkeys.activePublicKey
        },
        {
          label: i18next.t("onboard.public-posting"),
          value: decodedInfo.pubkeys.postingPublicKey
        },
        {
          label: i18next.t("onboard.public-memo"),
          value: decodedInfo.pubkeys.memoPublicKey
        }
      ]
    : [];

  const [rcOps, setRcOps] = useState<Record<string, { avg_cost: number }> | null>(null);

  // Fetch RC stats once when delegation is enabled
  useEffect(() => {
    if (!isChecked) {
      setRcAmount(0);
      setRcOps(null);
      return;
    }
    queryClient.fetchQuery(getRcStatsQueryOptions()).then((rcStats: any) => {
      setRcOps(rcStats.ops);
    });
  }, [isChecked]);

  // Recompute estimates and validation whenever rcAmount or rcOps change (no fetch)
  useEffect(() => {
    if (!rcOps || !isChecked) return;

    if (isNaN(rcAmount) || rcAmount * 1e9 < 5000000000) {
      setRcError(i18next.t("onboard.rc-error"));
    } else {
      setRcError("");
    }

    setCommentAmount(Math.ceil((rcAmount * 1e9) / rcOps.comment_operation.avg_cost));
    setVoteAmount(Math.ceil((rcAmount * 1e9) / rcOps.vote_operation.avg_cost));
    setTransferAmount(Math.ceil((rcAmount * 1e9) / rcOps.transfer_operation.avg_cost));
    setCustomJsonAmount(Math.ceil((rcAmount * 1e9) / rcOps.custom_json_operation.avg_cost));
  }, [rcAmount, rcOps, isChecked]);

  const onCreateAccount = async (type: "hive" | "credit") => {
    if (!activeUser || !decodedInfo?.pubkeys) return;

    const useClaimed = type === "credit";
    const newAccountName = decodedInfo.username.trim().toLowerCase();

    try {
      await createAccount({
        newAccountName,
        keys: decodedInfo.pubkeys,
        fee: (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).accountCreationFee,
        useClaimed
      });

      setModalStep("success");
      // Notify new user by email
      try {
        await onboardEmail(newAccountName, decodedInfo.email, activeUser.username);
      } catch {
        // Email notification is best-effort; account was already created
      }
    } catch (err: any) {
      setModalStep("failed");
      error(...formatError(err));
      return;
    }

    if (isChecked && !rcError) {
      try {
        await delegateRc({ to: newAccountName, maxRc: rcAmount * 1e9 });
      } catch (err: any) {
        error(...formatError(err));
      }
    }
  };

  const openSignModal = (option: "hive" | "credit") => {
    setCreateOption(option);
    setModalStep("sign");
  };

  // Invalid link
  if (!decodedInfo) {
    return (
      <div className="max-w-[500px] mx-auto text-center py-12">
        <p className="text-lg text-red">{i18next.t("onboard.invalid-link")}</p>
      </div>
    );
  }

  // Must be logged in to sponsor
  if (!activeUser) {
    return (
      <div className="max-w-[500px] mx-auto text-center py-12">
        <p className="text-lg">{i18next.t("onboard.login-warning")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] w-full mx-auto">
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 md:p-8">
        <h3 className="text-2xl font-semibold text-blue-dark-sky mb-2">
          {i18next.t("onboard.sponsor-title", {
            defaultValue: "Create account for a friend"
          })}
        </h3>
        <p className="opacity-60 text-sm mb-6">
          {i18next.t("onboard.sponsor-description", {
            defaultValue:
              "Your friend chose their username and saved their keys. Review the details below and create their account."
          })}
        </p>

        {/* Account + key details */}
        <div className="space-y-3 mb-6">
          {confirmFields.map((field, i) => (
            <div key={i}>
              <span className="opacity-60 text-sm">{field.label}</span>
              <strong className="block break-all text-sm">{field.value}</strong>
            </div>
          ))}
        </div>

        {/* RC delegation */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              checked={isChecked}
              onChange={() => setChecked(!isChecked)}
            />
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {i18next.t("onboard.rc-to-new-acc")} {decodedInfo.username}{" "}
              {i18next.t("onboard.minimum-rc")}
            </span>
          </label>

          {isChecked && (
            <div className="mt-3 pl-7">
              {rcError && (
                <p className="text-red text-sm mb-2">{rcError}</p>
              )}
              <InputGroup>
                <FormControl
                  type="text"
                  placeholder="Enter amount to delegate (Bn)"
                  value={rcAmount}
                  onChange={(e: any) => setRcAmount(Number(e.target.value))}
                />
              </InputGroup>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs opacity-75">
                <span>
                  {i18next.t("onboard.posts-comments")} {commentAmount}
                </span>
                <span>
                  {i18next.t("onboard.votes")} {voteAmount}
                </span>
                <span>
                  {i18next.t("onboard.transfers")} {transferAmount}
                </span>
                <span>
                  {i18next.t("onboard.reblogs-follows")} {customJsonAmount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payment buttons */}
        <div className="text-center">
          <p className="text-sm opacity-75 mb-3">
            {i18next.t("onboard.pay-fee")}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              disabled={isChecked && !!rcError}
              onClick={() => openSignModal("hive")}
            >
              {i18next.t("onboard.create-account-hive")}
            </Button>
            <Button
              disabled={accountCredit <= 0 || (isChecked && !!rcError)}
              onClick={() => openSignModal("credit")}
            >
              {i18next.t("onboard.create-account-credit", {
                n: accountCredit
              })}
            </Button>
          </div>
        </div>
      </div>

      {/* Sign / Success / Failed Modal */}
      <Modal
        show={!!modalStep}
        centered={true}
        onHide={() => setModalStep(null)}
        size="lg"
      >
        <ModalHeader closeButton={true}>
          <ModalTitle />
        </ModalHeader>
        <ModalBody>
          {modalStep === "sign" && (
            <div className="flex flex-col">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                <div className="font-semibold">
                  {i18next.t("onboard.sign-header-title")}
                </div>
                <div className="text-sm opacity-60">
                  {i18next.t("onboard.sign-sub-title")}
                </div>
              </div>
              {isCreatePending && <LinearProgress />}
              <div className="flex justify-center py-4">
                <Button
                  disabled={isCreatePending}
                  icon={
                    isCreatePending ? (
                      <Spinner className="mr-1.5 w-3.5 h-3.5" />
                    ) : undefined
                  }
                  iconPlacement="left"
                  onClick={() => onCreateAccount(createOption)}
                >
                  {i18next.t("onboard.sign-header-title")}
                </Button>
              </div>
              <p className="text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setModalStep(null);
                  }}
                >
                  {i18next.t("g.back")}
                </a>
              </p>
            </div>
          )}

          {modalStep === "success" && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-green mb-2">
                {i18next.t("trx-common.success-title")}
              </p>
              <p>
                {i18next.t("onboard.success-message")}{" "}
                <strong>{decodedInfo.username}</strong>
              </p>
              <Link href={`/@${decodedInfo.username}`}>
                <Button
                  className="mt-4"
                  onClick={() => setModalStep(null)}
                >
                  {i18next.t("g.finish")}
                </Button>
              </Link>
            </div>
          )}

          {modalStep === "failed" && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-red mb-2">
                {i18next.t("onboard.failed-title")}
              </p>
              <p className="text-red">
                {i18next.t("onboard.failed-message")}
              </p>
              <Button
                className="mt-4"
                onClick={() => setModalStep(null)}
              >
                {i18next.t("onboard.try-again")}
              </Button>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
