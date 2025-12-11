import { TransferFormHeader } from "@/features/shared/transfer/transfer-form-header";
import i18next from "i18next";
import { Button } from "@ui/button";
import { TransferAsset } from "@/features/shared";
import { Form } from "@ui/form";
import { FormControl, InputGroup } from "@ui/input";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  dateToFullRelative,
  formatNumber,
  formattedNumber,
  HiveWallet,
  parseAsset,
  vestsToHp
} from "@/utils";
import { useGlobalStore } from "@/core/global-store";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery, getPointsQuery } from "@/api/queries";
import { TransferFormText } from "@/features/shared/transfer/transfer-form-text";
import { TransferAssetSwitch } from "@/features/shared/transfer/transfer-assets-switch";
import { EXCHANGE_ACCOUNTS } from "@/consts";
import { useTransferSharedState } from "./transfer-shared-state";
import { useDebounceTransferAccountData } from "./use-debounce-transfer-account-data";
import { amountFormatCheck } from "@/utils/amount-format-check";
import { cryptoUtils } from "@hiveio/dhive";
import { EcencyConfigManager } from "@/config";
import { TransferStep1To } from "@/features/shared/transfer/transfer-step-1-to";

interface Props {
  titleLngKey: string;
}

export function TransferStep1({ titleLngKey }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const {
    asset,
    memo,
    setMemo,
    step,
    to,
    mode,
    setExchangeWarning,
    setStep,
    setAmount,
    amount,
    amountError,
    setAmountError,
    memoError,
    setMemoError,
    exchangeWarning,
    setAsset
  } = useTransferSharedState();

  const { data: activeUserPoints } = getPointsQuery(activeUser?.username).useClientQuery();
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const { toWarning, toData, delegatedAmount, toError, delegateAccount } =
    useDebounceTransferAccountData();

  const w = useMemo(
    () => new HiveWallet(activeUser!.data, dynamicProps ?? DEFAULT_DYNAMIC_PROPS),
    [activeUser, dynamicProps]
  );
  const subTitleLngKey = useMemo(() => `${mode}-sub-title`, [mode]);

  const showTo = useMemo(
    () => ["transfer", "transfer-saving", "withdraw-saving", "power-up", "delegate"].includes(mode),
    [mode]
  );
  const canSubmit = useMemo(
    () =>
      toData &&
      !toError &&
      (!showTo || to) &&
      !amountError &&
      !memoError &&
      !exchangeWarning &&
      parseFloat(amount) > 0,
    [amount, amountError, exchangeWarning, memoError, showTo, to, toData, toError]
  );
  const assets = useMemo(() => {
    let assets: TransferAsset[] = [];
    switch (mode) {
      case "transfer":
        if (EcencyConfigManager.CONFIG.visionFeatures.points.enabled) {
          assets = ["HIVE", "HBD", "POINT"];
        } else {
          assets = ["HIVE", "HBD"];
        }
        break;
      case "transfer-saving":
      case "withdraw-saving":
        assets = ["HIVE", "HBD"];
        break;
      case "claim-interest":
        assets = ["HBD"];
        break;
      case "convert":
        assets = ["HBD"];
        break;
      case "power-up":
        assets = ["HIVE"];
        break;
      case "power-down":
      case "delegate":
        assets = ["HP"];
        break;
    }

    return assets;
  }, [mode]);
  const showMemo = useMemo(
    () => ["transfer", "transfer-saving", "withdraw-saving"].includes(mode),
    [mode]
  );

  const getBalance = useCallback((): number => {
    if (asset === "POINT") {
      return parseAsset(activeUserPoints?.points ?? "0.0").amount;
    }
    const w = new HiveWallet(activeUser!.data, dynamicProps ?? DEFAULT_DYNAMIC_PROPS);

    if (mode === "withdraw-saving" || mode === "claim-interest") {
      return asset === "HIVE" ? w.savingBalance : w.savingBalanceHbd;
    }

    if (asset === "HIVE") {
      return w.balance;
    }

    if (asset === "HBD") {
      return w.hbdBalance;
    }

    if (asset === "HP") {
      const { hivePerMVests } = dynamicProps ?? DEFAULT_DYNAMIC_PROPS;
      const vestingShares = w.vestingSharesAvailable;
      return vestsToHp(vestingShares, hivePerMVests);
    }

    return 0;
  }, [activeUser, activeUserPoints?.points, asset, dynamicProps, mode]);

  useEffect(() => {
    if (amount === "") {
      setAmountError("");
      return;
    }

    if (!amountFormatCheck(amount)) {
      setAmountError(i18next.t("transfer.wrong-amount"));
      return;
    }

    const dotParts = amount.split(".");
    if (dotParts.length > 1) {
      const precision = dotParts[1];
      if (precision.length > 3) {
        setAmountError(i18next.t("transfer.amount-precision-error"));
        return;
      }
    }

    let balance = Number(formatNumber(getBalance(), 3));

    if (parseFloat(amount) > balance + delegatedAmount) {
      setAmountError(i18next.t("trx-common.insufficient-funds"));
      return;
    }

    setAmountError("");
  }, [amount, delegatedAmount, getBalance, setAmountError]);

  const balance = useMemo(() => {
    let balance: string | number = formatNumber(getBalance(), 3);
    if (delegatedAmount) {
      balance = Number(balance) + delegatedAmount;
      balance = Number(balance).toFixed(3);
    }

    return balance;
  }, [delegatedAmount, getBalance]);

  useEffect(() => {
    if (EXCHANGE_ACCOUNTS.includes(to)) {
      if ((asset === "HIVE" || asset === "HBD") && !memo) {
        setExchangeWarning(i18next.t("transfer.memo-required"));
      } else {
        setExchangeWarning("");
      }
    }
  }, [to, memo, asset, setExchangeWarning]);

  const nextPowerDown = useCallback(() => {
    setStep(2);
    setAmount("0.000");
  }, [setAmount, setStep]);

  const next = useCallback(() => {
    // make sure 3 decimals in amount
    const fixedAmount = formatNumber(amount, 3);
    setAmount(fixedAmount);
    setStep(2);
  }, [amount, setAmount, setStep]);

  const memoChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const { value: memo } = e.target;
      const mError = cryptoUtils.isWif(memo.trim());
      if (mError) setMemoError(i18next.t("transfer.memo-error").toUpperCase());
      setMemo(memo);
    },
    [setMemo, setMemoError]
  );

  return (
    <>
      {step === 1 && mode === "power-down" && w.isPoweringDown && (
        <div className="transfer-dialog-content">
          <div className="transaction-form">
            <TransferFormHeader title={titleLngKey} step={step} subtitle={subTitleLngKey} />
            <div className="transaction-form-body powering-down">
              <p>{i18next.t("transfer.powering-down")}</p>
              <p>
                {i18next.t("wallet.next-power-down", {
                  time: dateToFullRelative(w.nextVestingWithdrawalDate.toString()),
                  amount: `${formatNumber(w.nextVestingSharesWithdrawalHive, 3)} HIVE`,
                  weeks: w.weeksLeft
                })}
              </p>
              <Button
                onClick={nextPowerDown}
                appearance="danger"
                className="mt-4"
                size="lg"
                outline={true}
              >
                {i18next.t("transfer.stop-power-down")}
              </Button>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (mode !== "power-down" || !w.isPoweringDown) && (
        <div className="transaction-form">
          <TransferFormHeader title={titleLngKey} step={step} subtitle={subTitleLngKey} />
          <Form className="transaction-form-body">
            <div className="grid items-center grid-cols-12 mb-4">
              <div className="col-span-12 sm:col-span-2">
                <label>{i18next.t("transfer.from")}</label>
              </div>
              <div className="col-span-12 sm:col-span-10">
                <InputGroup prepend="@">
                  <FormControl type="text" value={activeUser!.username} readOnly={true} />
                </InputGroup>
              </div>
            </div>

            {showTo && <TransferStep1To toError={toError} toWarning={toWarning} />}

            <div className="grid items-center grid-cols-12">
              <div className="col-span-12 sm:col-span-2">
                <label>{i18next.t("transfer.amount")}</label>
              </div>
              <div className="col-span-12 sm:col-span-10 flex items-center">
                <InputGroup prepend="#">
                  <FormControl
                    type="text"
                    placeholder={i18next.t("transfer.amount-placeholder")}
                    value={amount}
                    onChange={(e) => {
                      const { value: amount } = e.target;
                      setAmount(amount);
                    }}
                    className={amount > balance && amountError ? "is-invalid" : ""}
                    autoFocus={mode !== "transfer"}
                  />
                </InputGroup>
                {assets.length > 1 && (
                  <TransferAssetSwitch
                    options={assets}
                    selected={asset}
                    onChange={(e) => setAsset(e)}
                  />
                )}
              </div>
            </div>

            {amountError && amount > balance && (
              <TransferFormText msg={amountError} type="danger" />
            )}

            <div className="grid items-center grid-cols-12">
              <div className="col-span-12 lg:col-span-10 lg:col-start-3">
                <div className="balance">
                  <span className="balance-label">
                    {i18next.t("transfer.balance")}
                    {": "}
                  </span>
                  <span
                    className="balance-num"
                    onClick={() => setAmount(formatNumber(getBalance(), 3))}
                  >
                    {balance} {asset}
                  </span>
                  {asset === "HP" && (
                    <div className="balance-hp-hint">{i18next.t("transfer.available-hp-hint")}</div>
                  )}
                </div>
                {to!.length > 0 &&
                  Number(amount) > 0 &&
                  toData &&
                  mode === "delegate" && (
                    <div className="text-gray-600 mt-1 override-warning">
                      {i18next.t("transfer.override-warning-1")}
                      {delegateAccount && (
                        <>
                          <br />
                          {i18next.t("transfer.override-warning-2", {
                            account: to,
                            previousAmount: formattedNumber(delegatedAmount)
                          })}
                        </>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {showMemo && (
              <>
                <div className="grid items-center grid-cols-12 mb-4">
                  <div className="col-span-12 sm:col-span-2">
                    <label>{i18next.t("transfer.memo")}</label>
                  </div>
                  <div className="col-span-12 sm:col-span-10">
                    <FormControl
                      type="text"
                      placeholder={i18next.t("transfer.memo-placeholder")}
                      value={memo}
                      onChange={memoChanged}
                    />
                    <TransferFormText msg={i18next.t("transfer.memo-help")} type="muted" />
                    {memoError && <TransferFormText msg={memoError} type="danger" />}
                  </div>
                </div>
              </>
            )}

            <div className="grid items-center grid-cols-12 mb-4">
              <div className="col-span-12 sm:col-span-10 sm:col-start-3">
                <Button onClick={next} disabled={!canSubmit}>
                  {i18next.t("g.next")}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </>
  );
}
