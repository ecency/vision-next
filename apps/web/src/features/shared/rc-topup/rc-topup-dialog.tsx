"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import {
  getRcDelegationPricesQueryOptions,
  getPointsQueryOptions,
  getRcDelegationActiveQueryOptions
} from "@ecency/sdk";
import { ensureValidToken } from "@/utils";
import dayjs from "@/utils/dayjs";
import i18next from "i18next";
import { LinearProgress } from "@/features/shared";
import { checkAllSvg } from "@ui/svg";
import { useQuery } from "@tanstack/react-query";
import { withFeatureFlag } from "@/core/react-query";
import { useRcDelegationMutation } from "@/api/sdk-mutations";

interface Props {
  onHide: () => void;
}

/**
 * RC top-up purchase dialog: spend Ecency Points for a short-term, RC-only
 * delegation to the active user's OWN account (delegate_rc, no Hive Power).
 * Mirrors {@link BoostDialog} but self-only and RC-scoped. Gate the trigger
 * behind visionFeatures.rcTopup; this component assumes the flag is on.
 */
export function RcTopupDialog({ onHide }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Resolve a guaranteed-fresh access token before the token-gated price/active
  // queries. getAccessToken() returns a STALE token for expired/legacy sessions,
  // which 401s the private API and leaves the dialog with no duration options;
  // ensureValidToken awaits the background refresh first.
  const [accessToken, setAccessToken] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (!username) {
      setAccessToken("");
      return;
    }
    ensureValidToken(username).then((token) => {
      if (!cancelled) {
        setAccessToken(token ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const { data: prices } = useQuery({
    ...getRcDelegationPricesQueryOptions(accessToken),
    select: (data) => [...data].sort((a, b) => a.duration - b.duration)
  });

  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(0);

  const { mutateAsync: rcTopup, isPending } = useRcDelegationMutation();

  const { data: activeUserPoints } = useQuery(
    withFeatureFlag(
      ({ visionFeatures }) => visionFeatures.points.enabled,
      getPointsQueryOptions(activeUser?.username)
    )
  );

  const { data: activeTopup, isLoading: activeLoading } = useQuery(
    getRcDelegationActiveQueryOptions(activeUser?.username ?? "", accessToken)
  );

  const price = useMemo(
    () => prices?.find((x) => x.duration === duration)?.price ?? 0,
    [prices, duration]
  );
  const balanceError = useMemo(
    () =>
      parseFloat(activeUserPoints?.points ?? "0") < price
        ? i18next.t("trx-common.insufficient-funds")
        : "",
    [activeUserPoints, price]
  );
  const isAlreadyActive = useMemo(
    () => (activeTopup?.expires ? dayjs(activeTopup.expires).isAfter(dayjs()) : false),
    [activeTopup]
  );
  const canSubmit = useMemo(
    () => !balanceError && !isAlreadyActive && !activeLoading && duration > 0,
    [balanceError, isAlreadyActive, activeLoading, duration]
  );

  const inProgress = isPending;

  useEffect(() => {
    if (prices && prices.length > 0) {
      setDuration(prices[0].duration);
    }
  }, [prices]);

  const isSubmittingRef = useRef(false);
  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await rcTopup({ duration });
      setStep(2);
    } finally {
      isSubmittingRef.current = false;
    }
  }, [duration, rcTopup]);

  const finish = () => onHide();

  return (
    <Modal show={true} centered={true} onHide={onHide} className="rc-topup-dialog" size="lg">
      <ModalHeader thin={true} closeButton={true} />
      <ModalBody>
        <div className="promote-dialog-content">
          {step === 1 && (
            <div className={`transaction-form ${inProgress ? "in-progress" : ""}`}>
              <div className="transaction-form-header">
                <div className="step-no">1</div>
                <div className="box-titles">
                  <div className="main-title">{i18next.t("rc-topup.title")}</div>
                  <div className="sub-title">{i18next.t("rc-topup.sub-title")}</div>
                </div>
              </div>
              {inProgress && <LinearProgress />}
              <div className="transaction-form-body flex flex-col">
                <div className="grid grid-cols-12 mb-4">
                  <div className="col-span-12 sm:col-span-2 flex items-center">
                    <label>{i18next.t("redeem-common.balance")}</label>
                  </div>
                  <div className="col-span-12 sm:col-span-10">
                    <FormControl
                      type="text"
                      className={`balance-input ${balanceError ? "is-invalid" : ""}`}
                      plaintext={true}
                      readOnly={true}
                      value={`${activeUserPoints?.points ?? "0.000"} POINTS`}
                    />
                    <div className="pl-3 mt-1">
                      <a
                        href="/perks/points"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-dark-sky hover:underline text-sm font-semibold"
                      >
                        {i18next.t("rc-topup.get-points")}
                      </a>
                    </div>
                    {balanceError && <small className="pl-3 text-red">{balanceError}</small>}
                    {isAlreadyActive && (
                      <div>
                        <small className="pl-3 text-red">
                          {i18next.t("rc-topup.already-active", {
                            date: dayjs(activeTopup!.expires).format("YYYY-MM-DD HH:mm")
                          })}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-12 mb-4">
                  <div className="col-span-12 sm:col-span-2 flex items-center">
                    <label>{i18next.t("promote.duration")}</label>
                  </div>
                  <div className="col-span-12 sm:col-span-10">
                    <FormControl
                      type="select"
                      value={duration}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setDuration(+e.target.value)}
                      disabled={inProgress}
                    >
                      {prices?.map(({ price, duration }) => (
                        <option value={duration} key={duration}>
                          {`${duration} ${
                            duration === 1 ? i18next.t("g.day") : i18next.t("g.days")
                          } - ${price} POINTS`}
                        </option>
                      ))}
                    </FormControl>
                  </div>
                </div>
                <div className="grid grid-cols-12 mb-4">
                  <div className="col-span-12 sm:col-span-2 flex items-center" />
                  <div className="col-span-12 sm:col-span-10">
                    <Button onClick={handleSubmit} disabled={!canSubmit || inProgress}>
                      {i18next.t("g.next")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={`transaction-form ${inProgress ? "in-progress" : ""}`}>
              <div className="transaction-form-header">
                <div className="step-no">2</div>
                <div className="box-titles">
                  <div className="main-title">{i18next.t("trx-common.success-title")}</div>
                  <div className="sub-title">{i18next.t("trx-common.success-sub-title")}</div>
                </div>
              </div>
              {inProgress && <LinearProgress />}
              <div className="transaction-form-body">
                <p className="flex justify-center align-content-center">
                  <span className="svg-icon text-green">{checkAllSvg}</span>{" "}
                  {i18next.t("rc-topup.success-message")}
                </p>
                <div className="flex justify-center">
                  <Button onClick={finish}>{i18next.t("g.finish")}</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
