"use client";

import React, { useEffect, useState } from "react";
import { PrivateKey } from "@hiveio/dhive";
import "./_page.scss";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Button } from "@ui/button";
import { FormControl, InputGroup } from "@ui/input";
import { Alert } from "@ui/alert";
import { b64uDec, b64uEnc } from "@/utils";
import { FullAccount } from "@/entities";
import useMount from "react-use/lib/useMount";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { copyContent, downloadSvg, regenerateSvg } from "@ui/svg";
import {
  error,
  Feedback,
  KeyOrHot,
  LinearProgress,
  Navbar,
  success,
  Theme
} from "@/features/shared";
import { clipboard } from "@/utils/clipboard";
import { Tooltip } from "@ui/tooltip";
import Head from "next/head";
import { getRcOperationStats } from "@/api/hive";
import {
  createAccountHs,
  createAccountKc,
  createAccountKey,
  createAccountWithCreditHs,
  createAccountWithCreditKc,
  createAccountWithCreditKey,
  delegateRC
} from "@/api/operations";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { onboardEmail } from "@/api/private-api";
import { getKeysFromSeed } from "@/utils/onBoard-helper";
import { useSeedPhrase } from "@/features/wallet/sdk";
import { useDownloadSeed } from "@/features/wallet";

export interface AccountInfo {
  email: string;
  username: string;
  referral: string;
  keys: {
    active?: string;
    activePubkey: string;
    memo?: string;
    memoPubkey: string;
    owner?: string;
    ownerPubkey: string;
    posting?: string;
    postingPubkey: string;
  };
}

export interface DecodeHash {
  email: string;
  username: string;
  referral?: string;
  pubkeys: {
    ownerPublicKey: string;
    activePublicKey: string;
    postingPublicKey: string;
    memoPublicKey: string;
  };
}

export interface ConfirmDetails {
  label: string;
  value: string;
}

const createOptions = {
  HIVE: "hive",
  CREDIT: "credit"
};

interface Props {
  params: { slugs: string[] };
}

export const OnboardFriend = ({ params: { slugs } }: Props) => {
  const type = slugs[0];
  const paramSecret = slugs[1];

  const activeUser = useGlobalStore((state) => state.activeUser);
  const queryParams = useSearchParams();
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  const [secret, setSecret] = useState("");
  const [accountInfo, setAccountInfo] = useState<AccountInfo>();
  const [decodedInfo, setDecodedInfo] = useState<DecodeHash>();
  const { data: seedPhrase = "", refetch: refetchSeed } = useSeedPhrase(
    type === "asking" ? decodedInfo?.username ?? "" : ""
  );
  const [showModal, setShowModal] = useState(false);
  const [accountCredit, setAccountCredit] = useState(0);
  const [createOption, setCreateOption] = useState("");
  const [fileIsDownloaded, setFileIsDownloaded] = useState(false);
  const [innerWidth, setInnerWidth] = useState(0);
  const [shortSeed, setShortSeed] = useState("");
  const [confirmDetails, setConfirmDetails] = useState<ConfirmDetails[]>();
  const [onboardUrl, setOnboardUrl] = useState("");
  const [step, setStep] = useState<string | number>(0);
  const [inProgress, setInprogress] = useState(false);
  const [rcAmount, setRcAmount] = useState(0);
  const [isChecked, setChecked] = useState(false);
  const [rcError, setRcError] = useState("");
  const [commentAmount, setCommentAmount] = useState(0);
  const [voteAmount, setVoteAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [customJsonAmount, setCustomJsonAmount] = useState(0);

  const downloadSeed = useDownloadSeed(accountInfo?.username ?? decodedInfo?.username ?? "");

  useMount(() => {
    setOnboardUrl(`${window.location.origin}/onboard-friend/creating/`);
    setInnerWidth(window.innerWidth);
    try {
      if (paramSecret) {
        const decodedHash = JSON.parse(b64uDec(paramSecret));
        setDecodedInfo(decodedHash);
      }
    } catch (err) {
      console.log(err);
    }
  });

  useEffect(() => {
    if (type === "asking" && seedPhrase && decodedInfo) {
      initAccountKey();
    }
  }, [type, seedPhrase, decodedInfo]);

  useEffect(() => {
    (activeUser?.data as FullAccount) &&
      (activeUser?.data as FullAccount).pending_claimed_accounts &&
      setAccountCredit((activeUser?.data as FullAccount).pending_claimed_accounts);
  }, [activeUser]);

  useEffect(() => {
    if (decodedInfo) {
      setConfirmDetails([
        { label: i18next.t("onboard.username"), value: formatUsername(decodedInfo!.username) },
        { label: i18next.t("onboard.public-owner"), value: decodedInfo?.pubkeys?.ownerPublicKey },
        { label: i18next.t("onboard.public-active"), value: decodedInfo?.pubkeys?.activePublicKey },
        {
          label: i18next.t("onboard.public-posting"),
          value: decodedInfo?.pubkeys?.postingPublicKey
        },
        { label: i18next.t("onboard.public-memo"), value: decodedInfo?.pubkeys?.memoPublicKey }
      ]);
    }
  }, [decodedInfo]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [seedPhrase]);

  useEffect(() => {
    rcOperationsCost();
  }, [rcAmount]);

  useEffect(() => {
    if (!isChecked) {
      setRcAmount(0);
    }
  }, [isChecked]);

  const handleResize = () => {
    setInnerWidth(window.innerWidth);
    let seed: string = "";
    if (window.innerWidth <= 768 && window.innerWidth > 577) {
      seed = seedPhrase.substring(0, 32);
    } else if (window.innerWidth <= 577) {
      seed = seedPhrase.substring(0, 20);
    }
    setShortSeed(seed);
  };

  const initAccountKey = () => {
    if (!decodedInfo) {
      return;
    }

    try {
      const keys: AccountInfo["keys"] = getKeysFromSeed(seedPhrase);
      const pubkeys = {
        activePublicKey: keys.activePubkey,
        memoPublicKey: keys.memoPubkey,
        ownerPublicKey: keys.ownerPubkey,
        postingPublicKey: keys.postingPubkey
      };

      const dataToEncode = {
        username: decodedInfo.username,
        email: decodedInfo.email,
        pubkeys
      };
      const stringifiedData = JSON.stringify(dataToEncode);
      const hashedPubKeys = b64uEnc(stringifiedData);
      setSecret(hashedPubKeys);
      const accInfo = {
        username: formatUsername(decodedInfo.username),
        email: formatEmail(decodedInfo.email),
        referral: formatUsername(decodedInfo.referral || ""),
        keys
      };
      setAccountInfo(accInfo);
    } catch (err: any) {
      error(err?.message);
    }
  };

  const sendMail = async () => {
    const username = decodedInfo!.username || accountInfo!.username;
    const email = decodedInfo!.email || accountInfo!.email;
    if (activeUser) {
      await onboardEmail(formatUsername(username), formatEmail(email), activeUser?.username);
    }
  };

  const splitUrl = (url: string) => {
    return url.slice(0, 50);
  };

  const formatUsername = (username: string) => {
    return username?.replace(/\+/g, "-").replace(/=/g, ".");
  };

  const formatEmail = (username: string) => {
    return username?.replace(/\+/g, "-").replace(/=/g, ".").replace(/\//g, "_");
  };

  const onKc = async (type: string) => {
    if (activeUser) {
      try {
        if (type === createOptions.HIVE) {
          const resp = await createAccountKc(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys,
              fee: (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).accountCreationFee
            },
            activeUser?.username
          );
          if (resp.success == true) {
            setInprogress(false);
            setStep("success");
            sendMail();
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
          } else {
            setStep("failed");
          }
        } else {
          const resp = await createAccountWithCreditKc(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys
            },
            activeUser?.username
          );
          if (resp.success == true) {
            setInprogress(false);
            setStep("success");
            sendMail();
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
          } else {
            setStep("failed");
          }
        }
      } catch (err: any) {
        if (err) {
          setStep("failed");
        }
        error(err.message);
      }
    }
  };

  const onKey = async (type: string, key: PrivateKey) => {
    if (activeUser) {
      try {
        if (type === createOptions.HIVE) {
          const resp = await createAccountKey(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys,
              fee: (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).accountCreationFee
            },
            activeUser?.username,
            key
          );
          if (resp.id) {
            setInprogress(false);
            setStep("success");
            sendMail();
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
          } else {
            setStep("failed");
          }
        } else {
          const resp = await createAccountWithCreditKey(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys
            },
            activeUser?.username,
            key
          );
          if (resp.id) {
            setInprogress(false);
            setStep("success");
            sendMail();
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
          } else {
            setStep("failed");
          }
        }
      } catch (err: any) {
        if (err) {
          setStep("failed");
        }
        error(err.message);
      }
    }
  };

  const onHot = async (type: string) => {
    const dataToEncode = {
      username: formatUsername(decodedInfo!.username),
      email: formatEmail(decodedInfo!.email)
    };
    const stringifiedData = JSON.stringify(dataToEncode);
    const hashedInfo = b64uEnc(stringifiedData);
    if (activeUser) {
      try {
        if (type === createOptions.HIVE) {
          const resp = await createAccountHs(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys,
              fee: (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).accountCreationFee
            },
            activeUser?.username,
            hashedInfo
          );
          if (resp) {
            setInprogress(false);
            setShowModal(false);
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
            // sendMail();
          }
        } else {
          const resp = await createAccountWithCreditHs(
            {
              username: formatUsername(decodedInfo!.username),
              pub_keys: decodedInfo?.pubkeys
            },
            activeUser?.username,
            hashedInfo
          );
          if (resp) {
            setInprogress(false);
            setShowModal(false);
            if (isChecked) {
              await delegateRC(
                activeUser?.username,
                formatUsername(decodedInfo!.username),
                rcAmount * 1e9
              );
            }
            // sendMail();
          }
        }
      } catch (err: any) {
        if (err) {
          setShowModal(false);
        }
        error(err.message);
      }
    }
  };

  const signTransactionModal = (type: string) => {
    return (
      <>
        <div className="border-b border-[--border-color] flex items-center">
          <div className="step-no">2</div>
          <div>
            <div>{i18next.t("onboard.sign-header-title")}</div>
            <div>{i18next.t("onboard.sign-sub-title")}</div>
          </div>
        </div>
        {inProgress && <LinearProgress />}
        <KeyOrHot
          inProgress={inProgress}
          onKey={(value) => onKey(type, value)}
          onHot={() => onHot(type)}
          onKc={() => onKc(type)}
        />
        <p className="text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowModal(false);
            }}
          >
            {i18next.t("g.back")}
          </a>
        </p>
      </>
    );
  };

  const rcOperationsCost = async () => {
    const rcStats: any = await getRcOperationStats();
    const operationCosts = rcStats.rc_stats.ops;
    const commentCost = operationCosts.comment_operation.avg_cost;
    const transferCost = operationCosts.transfer_operation.avg_cost;
    const voteCost = operationCosts.vote_operation.avg_cost;
    const customJsonOperationsCosts = operationCosts.custom_json_operation.avg_cost;
    if (Number(rcAmount * 1e9) < 5000000000) {
      setRcError(i18next.t("onboard.rc-error"));
    } else {
      setRcError("");
    }

    const commentCount: number = Math.ceil(Number(rcAmount * 1e9) / commentCost);
    const votetCount: number = Math.ceil(Number(rcAmount * 1e9) / voteCost);
    const transferCount: number = Math.ceil(Number(rcAmount * 1e9) / transferCost);
    const customJsonCount: number = Math.ceil(Number(rcAmount * 1e9) / customJsonOperationsCosts);

    setCommentAmount(commentCount);
    setVoteAmount(votetCount);
    setTransferAmount(transferCount);
    setCustomJsonAmount(customJsonCount);
  };

  const successModalBody = () => {
    return (
      <>
        <div className="create-account-success-dialog-header border-b border-[--border-color] flex">
          <div className="step-no">2</div>
          <div className="create-account-success-dialog-titles">
            <div className="create-account-main-title">{i18next.t("trx-common.success-title")}</div>
            <div className="create-account-sub-title">
              {i18next.t("trx-common.success-sub-title")}
            </div>
          </div>
        </div>

        <div className="success-dialog-body">
          <div className="success-dialog-content">
            <span>
              {i18next.t("onboard.success-message")}{" "}
              <strong>{formatUsername(decodedInfo!.username)}</strong>
            </span>
          </div>
          <div className="flex justify-center">
            <Link href={`/@${formatUsername(decodedInfo!.username)}`}>
              <Button className="mt-3" onClick={finish}>
                {i18next.t("g.finish")}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  };
  const failedModalBody = () => {
    return (
      <>
        <div className="create-account-success-dialog-header border-b border-[--border-color] flex text-red">
          <div className="step-no">❌</div>
          <div className="create-account-success-dialog-titles">
            <div className="create-account-main-title">{i18next.t("onboard.failed-title")}</div>
            <div className="create-account-sub-title">{i18next.t("onboard.failed-subtitle")}</div>
          </div>
        </div>

        <div className="success-dialog-body">
          <div className="success-dialog-content">
            <span className="text-red">{i18next.t("onboard.failed-message")}</span>
          </div>
          <div className="flex justify-center">
            <span className="hr-6px-btn-spacer" />
            <Button onClick={finish}>{i18next.t("onboard.try-again")}</Button>
          </div>
        </div>
      </>
    );
  };

  const finish = () => {
    setShowModal(false);
    setStep(0);
  };

  return (
    <>
      <Head>
        <title>Onboarding a Friend</title>
      </Head>
      <Theme />
      <Feedback />
      <Navbar />
      {type === "asking" && paramSecret && (
        <div className="onboard-container">
          <div className="asking">
            <div
              className={`asking-body flex mb-0 self-center flex-col ${
                innerWidth < 577 ? "p-3" : "p-5"
              }`}
            >
              <h3 className="mb-3 self-center text-2xl font-semibold text-blue-dark-sky">
                {i18next.t("onboard.confirm-details")}
              </h3>
              <div className="reg-details">
                <span style={{ lineHeight: 2 }}>
                  {i18next.t("onboard.username")} <strong>{accountInfo?.username}</strong>
                </span>
                <span style={{ lineHeight: 2 }}>
                  {i18next.t("onboard.email")} <strong>{accountInfo?.email}</strong>
                </span>
                <span style={{ lineHeight: 2 }}>
                  {i18next.t("onboard.referral")} <strong>{accountInfo?.referral}</strong>
                </span>
              </div>
              <span className="mt-3">{i18next.t("onboard.copy-key")}</span>
              <div className="mt-3 flex flex-col items-center">
                <div className="flex">
                  <span className="mr-3 mt-1">
                    {innerWidth <= 768 ? shortSeed + "..." : seedPhrase}
                  </span>
                  <Tooltip content={i18next.t("onboard.copy-tooltip")}>
                    <span
                      className="onboard-svg mr-3"
                      onClick={() => {
                        clipboard(seedPhrase);
                        success(i18next.t("onboard.copy-password"));
                      }}
                    >
                      {copyContent}
                    </span>
                  </Tooltip>
                  <Tooltip content={i18next.t("onboard.regenerate-password")}>
                    <span className="onboard-svg" onClick={() => refetchSeed()}>
                      {regenerateSvg}
                    </span>
                  </Tooltip>
                </div>
                <Button
                  className="self-center mt-3"
                  disabled={!accountInfo?.username || !accountInfo.email}
                  onClick={() => {
                    setFileIsDownloaded(false);
                    downloadSeed();
                    setFileIsDownloaded(true);
                  }}
                  icon={downloadSvg}
                >
                  {i18next.t("onboard.download-keys")}
                </Button>

                {fileIsDownloaded && (
                  <Alert className="flex flex-col self-center justify-center mt-3">
                    <h4>{i18next.t("onboard.copy-info-message")}</h4>
                    <div className="flex items-center">
                      <span className="">{splitUrl(onboardUrl + secret)}...</span>
                      <span
                        style={{ width: "5%" }}
                        className="onboard-svg"
                        onClick={() => {
                          clipboard(onboardUrl + secret);
                          success(i18next.t("onboard.copy-link"));
                        }}
                      >
                        {copyContent}
                      </span>
                    </div>
                    {activeUser && (
                      <span className="mt-2">
                        <a href={onboardUrl + secret}>{i18next.t("onboard.click-link")}</a>
                      </span>
                    )}
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {type === "creating" && paramSecret && (
        <div className="onboard-container">
          {activeUser ? (
            <div className="creating-confirm asking asking-body p-4">
              <h3 className="align-self-center text-2xl font-semibold text-blue-dark-sky">
                {i18next.t("onboard.confirm-details")}
              </h3>
              {confirmDetails && (
                <>
                  {confirmDetails.map((field, index) => (
                    <span key={index}>
                      {field.label}
                      <strong style={{ wordBreak: "break-word", marginLeft: "10px" }}>
                        {field.value}
                      </strong>
                    </span>
                  ))}
                </>
              )}

              <div className="onboard-delegate-rc">
                <div className="col-span-12 sm:col-span-10">
                  <div className="onboard-check mb-2">
                    <input
                      type="checkbox"
                      className="onboard-checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setChecked(!isChecked);
                      }}
                    />
                    <span className="onboard-blinking-text">
                      {i18next.t("onboard.rc-to-new-acc")} {decodedInfo && decodedInfo!.username}{" "}
                      {i18next.t("onboard.minimum-rc")}
                    </span>
                  </div>
                  {isChecked && (
                    <div className="mt-3">
                      {rcAmount && rcError ? (
                        <span className="text-danger mt-3">{rcError}</span>
                      ) : (
                        ""
                      )}
                      <InputGroup>
                        <FormControl
                          type="text"
                          placeholder={"Enter amount to delegate(Bn)"}
                          value={rcAmount}
                          onChange={(e: any) => setRcAmount(Number(e.target.value))}
                        />
                      </InputGroup>
                      <div className="operation-amount d-flex mt-3">
                        <span className="operations">
                          {i18next.t("onboard.posts-comments")} {commentAmount} |
                        </span>
                        <span className="operations">
                          {i18next.t("onboard.votes")} {voteAmount} |
                        </span>
                        <span className="operations">
                          {i18next.t("onboard.transfers")} {transferAmount} |
                        </span>
                        <span className="operations">
                          {i18next.t("onboard.reblogs-follows")} {customJsonAmount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="creating-confirm-bottom">
                <span>{i18next.t("onboard.pay-fee")}</span>
                <div className="onboard-btn-container">
                  <Button
                    className="align-self-center"
                    onClick={() => {
                      setCreateOption("hive");
                      setShowModal(true);
                      setStep("sign");
                    }}
                  >
                    {i18next.t("onboard.create-account-hive")}
                  </Button>
                  <Button
                    className="align-self-center"
                    disabled={accountCredit <= 0 || (isChecked && rcError !== "")}
                    onClick={() => {
                      setCreateOption("credit");
                      setShowModal(true);
                      setStep("sign");
                    }}
                  >
                    {i18next.t("onboard.create-account-credit", { n: accountCredit })}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="login-warning">{i18next.t("onboard.login-warning")}</div>
          )}
        </div>
      )}

      {type === "confirming" && (
        <div className="onboard-container">
          <div className="login-warning">
            <span>
              {i18next.t("onboard.success-message")}{" "}
              <strong>@{formatUsername(decodedInfo!.username)}</strong>
            </span>
          </div>
          <Link href={`/@${formatUsername(decodedInfo!.username)}`}>
            <Button
              className="mt-3 w-[50%] align-self-center"
              onClick={() => {
                if (queryParams?.has("tid")) {
                  sendMail();
                }
              }}
            >
              {i18next.t("g.finish")}
            </Button>
          </Link>
        </div>
      )}
      <Modal
        show={showModal}
        centered={true}
        onHide={() => setShowModal(false)}
        className="create-account-dialog"
        size="lg"
      >
        <ModalHeader closeButton={true}>
          <ModalTitle />
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col">
            {createOption === createOptions.HIVE && (
              <React.Fragment>
                {step === "sign" && signTransactionModal(createOptions.HIVE)}
                {step === "success" && successModalBody()}
                {step === "failed" && failedModalBody()}
              </React.Fragment>
            )}

            {createOption === createOptions.CREDIT && (
              <React.Fragment>
                {step === "sign" && signTransactionModal(createOptions.CREDIT)}
                {step === "success" && successModalBody()}
                {step === "failed" && failedModalBody()}
              </React.Fragment>
            )}
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};
