import { Button } from "@ui/button";
import i18next from "i18next";
import { FormControl, InputGroup } from "@ui/input";
import { LinearProgress } from "@/features/shared";
import { useGlobalStore } from "@/core/global-store";
import { Form } from "@ui/form";
import { useCallback, useEffect, useMemo, useState } from "react";
import numeral from "numeral";
import { cryptoUtils } from "@hiveio/dhive";
import { useDebounce } from "react-use";
import { getAccountFullQuery, getDynamicPropsQuery, useHiveEngineAssetWallet } from "@/api/queries";
import badActors from "@hiveio/hivescript/bad-actors.json";
import { amountFormatCheck } from "@/utils/amount-format-check";
import { formattedNumber, parseAsset, vestsToHp } from "@/utils";
import { EngineTransferFormHeader } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer/engine-transfer-form-header";

interface Props {
  mode: string;
  titleLngKey: string;
  subTitleLngKey: string;
  to: string;
  setTo: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  asset: string;
  onNext: () => void;
}

export function EngineTransferStep1({
  asset,
  mode,
  titleLngKey,
  subTitleLngKey,
  to,
  setTo,
  amount,
  setAmount,
  memo,
  setMemo,
  onNext
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [toInput, setToInput] = useState("");
  const [toDebouncedInput, setToDebouncedInput] = useState("");
  const [memoError, setMemoError] = useState<string>();
  const [toWarning, setToWarning] = useState<string>();
  const [toError, setToError] = useState<string>();

  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const { data: toData, isPending } = getAccountFullQuery(toDebouncedInput).useClientQuery();

  const assetWallet = useHiveEngineAssetWallet(asset);
  const hive = useMemo(() => Math.round((Number(amount) / 13) * 1000) / 1000, [amount]);
  const showTo = useMemo(
    () => ["transfer", "delegate", "undelegate", "stake"].includes(mode),
    [mode]
  );
  const showMemo = useMemo(() => ["transfer"].includes(mode), [mode]);
  const amountError = useMemo(() => {
    if (amount === "") {
      return "";
    }

    if (!amountFormatCheck(amount)) {
      return i18next.t("transfer.wrong-amount");
    }

    const dotParts = amount.split(".");
    if (dotParts.length > 1) {
      const _precision = dotParts[1];
      if (_precision.length > precision) {
        return i18next.t("transfer.amount-precision-error");
      }
    }

    if (parseFloat(amount) > (assetWallet?.balance ?? 0)) {
      return i18next.t("trx-common.insufficient-funds");
    }

    return "";
  }, [amount, assetWallet?.balance]);
  const canSubmit = useMemo(() => {
    if (mode === "unstake") return parseFloat(amount) > 0;
    return toData && !toError && !amountError && !memoError && !isPending && parseFloat(amount) > 0;
  }, [amount, amountError, isPending, memoError, mode, toData, toError]);

  const delegateAccount =
    delegationList &&
    delegationList.length > 0 &&
    delegationList!.find(
      (item) =>
        (item as DelegateVestingShares).delegatee === to &&
        (item as DelegateVestingShares).delegator === activeUser?.username
    );
  const previousAmount = delegateAccount
    ? Number(
        formattedNumber(
          vestsToHp(
            Number(parseAsset(delegateAccount!.vesting_shares).amount),
            dynamicProps?.hivePerMVests ?? 0
          )
        )
      )
    : "";

  useDebounce(
    () => {
      if (badActors.includes(toInput)) {
        setToWarning(i18next.t("transfer.to-bad-actor"));
        return;
      }

      if (toInput === toDebouncedInput) {
        return;
      }
      setToDebouncedInput(toInput);
    },
    500,
    [toInput, toDebouncedInput]
  );

  useEffect(() => {
    if (toData) {
      setTo(toData.name);
    }
  }, [setTo, toData]);

  const formatNumber = useCallback((num: number | string, precision: number) => {
    const format = `0.${"0".repeat(precision)}`;

    return numeral(num).format(format, Math.floor); // round to floor
  }, []);

  const handleMemo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value: memo } = e.target;
      const mError = cryptoUtils.isWif(memo);
      if (mError) {
        setMemoError(i18next.t("transfer.memo-error"));
      }
      setMemo(memo);
    },
    [setMemo]
  );

  const handleTo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (to === "") {
        setToWarning(undefined);
        setToError(undefined);
        return;
      }

      setToInput(e.target.value);
    },
    [to]
  );

  const copyBalance = useCallback(() => {
    const amount = formatNumber(assetWallet?.balance ?? 0, precision);
    setAmount(amount);
  }, [assetWallet?.balance, formatNumber, setAmount]);

  return (
    <div className={`transaction-form ${isPending ? "in-progress" : ""}`}>
      <EngineTransferFormHeader titleLngKey={titleLngKey} subTitleLngKey={subTitleLngKey} />
      {isPending && <LinearProgress />}
      <Form className="transaction-form-body">
        {mode !== "undelegate" && (
          <div className="grid items-center grid-cols-12 mb-4">
            <div className="col-span-12 sm:col-span-2">
              <label>{i18next.t("transfer.from")}</label>
            </div>
            <div className="col-span-12 sm:col-span-10">
              <InputGroup prepend="@">
                <FormControl type="text" value={activeUser?.username} readOnly={true} />
              </InputGroup>
            </div>
          </div>
        )}

        {showTo && (
          <>
            <div className="grid items-center grid-cols-12 mb-4">
              <div className="col-span-12 sm:col-span-2">
                <label>
                  {mode === "undelegate" ? i18next.t("transfer.from") : i18next.t("transfer.to")}
                </label>
              </div>
              <div className="col-span-12 sm:col-span-10">
                <InputGroup prepend="@">
                  <FormControl
                    type="text"
                    autoFocus={to === ""}
                    placeholder={i18next.t("transfer.to-placeholder")}
                    value={toInput}
                    onChange={handleTo}
                    className={toError ? "is-invalid" : ""}
                  />
                </InputGroup>
              </div>
            </div>
            {toWarning && (
              <div className="text-sm opacity-50 text-warning-default">{toWarning}</div>
            )}
            {toError && <div className="text-sm opacity-50 text-red">{toError}</div>}
          </>
        )}

        <div className="grid items-center grid-cols-12">
          <div className="col-span-12 sm:col-span-2">
            <label>{i18next.t("transfer.amount")}</label>
          </div>
          <div className="col-span-12 sm:col-span-10 flex items-center">
            <InputGroup prepend="#" append={asset}>
              <FormControl
                type="text"
                placeholder={i18next.t("transfer.amount-placeholder")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={amount > balance && amountError ? "is-invalid" : ""}
                autoFocus={mode !== "transfer"}
              />
            </InputGroup>
          </div>
        </div>

        {amountError && amount > balance && (
          <div className="text-sm opacity-50 text-red">{amountError}</div>
        )}

        <div className="grid items-center grid-cols-12">
          <div className="col-span-12 lg:col-span-10 lg:col-start-3">
            <div className="balance">
              <span className="balance-label">
                {i18next.t("transfer.balance")}
                {": "}
              </span>
              <span className="balance-num" onClick={copyBalance}>
                {assetWallet?.balance} {asset}
              </span>
              {asset === "HP" && (
                <div className="balance-hp-hint">{i18next.t("transfer.available-hp-hint")}</div>
              )}
            </div>
            {to.length > 0 && Number(amount) > 0 && toData?.__loaded && mode === "delegate" && (
              <div className="text-gray-600 mt-1 override-warning">
                {i18next.t("transfer.override-warning-1")}
                {delegateAccount && (
                  <>
                    <br />
                    {i18next.t("transfer.override-warning-2", {
                      account: to,
                      previousAmount: previousAmount
                    })}
                  </>
                )}
              </div>
            )}
            {mode === "unstake" && !isNaN(hive) && hive > 0 && (
              <div className="power-down-estimation">
                {i18next.t("transfer.power-down-estimated", {
                  n: `${formatNumber(hive, precision)} ${asset}`
                })}
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
                  onChange={handleMemo}
                />
                <div className="text-sm opacity-50">{i18next.t("transfer.memo-help")}</div>
                {memoError && <div className="text-sm opacity-50">{memoError}</div>}
              </div>
            </div>
          </>
        )}

        <div className="grid items-center grid-cols-12 mb-4">
          <div className="col-span-12 sm:col-span-10 sm:col-start-3">
            {/* Changed && to || since it just allows the form to submit anyway initially */}
            <Button onClick={onNext} disabled={!canSubmit || amount > balance || !!toError}>
              {i18next.t("g.next")}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
