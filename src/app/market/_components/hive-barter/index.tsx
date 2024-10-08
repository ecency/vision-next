import React, { useEffect, useState } from "react";
import { FormControl, InputGroup } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { BuySellHiveTransactionType } from "@/enums";
import { BuySellHiveDialog, error, Skeleton } from "@/features/shared";
import i18next from "i18next";

interface Props {
  type: 1 | 2;
  available: string;
  username: string;
  peakValue: number;
  basePeakValue: number;
  loading: boolean;
  onClickPeakValue: (value: any) => void;
  onTransactionSuccess: () => void;
  prefilledAmount?: any;
  prefilledTotal?: any;
  isInline?: boolean;
}

export const HiveBarter = ({
  type,
  available,
  peakValue,
  loading,
  username,
  basePeakValue,
  onClickPeakValue,
  onTransactionSuccess,
  prefilledAmount,
  prefilledTotal,
  isInline
}: Props) => {
  const [price, setPrice] = useState(peakValue.toFixed(6));
  const [amount, setAmount] = useState<any>(0.0);
  const [total, setTotal] = useState<any>(0.0);
  const [transaction, setTransaction] = useState<
    | BuySellHiveTransactionType.Sell
    | BuySellHiveTransactionType.Buy
    | BuySellHiveTransactionType.None
  >(BuySellHiveTransactionType.None);

  useEffect(() => {
    if (peakValue) {
      setPrice(peakValue.toFixed(6));
    }
  }, [peakValue]);

  useEffect(() => {
    if (prefilledAmount) {
      setAmountValue((+prefilledAmount).toFixed(3));
    }
    if (prefilledTotal) {
      setTotalValue((+prefilledTotal).toFixed(3));
    }
  }, [prefilledAmount, prefilledTotal]);

  const fixDecimals = (value: string, decimals: number): string => {
    let splittedValue = value.split(".");
    let valueAfterPoints = splittedValue[1];
    if (valueAfterPoints && valueAfterPoints.length > decimals) {
      valueAfterPoints = valueAfterPoints.substring(0, decimals);
      error(i18next.t("market.decimal-error", { decimals }));
      return `${splittedValue[0] + "." + valueAfterPoints}`;
    }
    return value;
  };

  const setTotalValue = (value: any) => {
    setTotal(isNaN(value) ? 0 : value.includes(".") ? fixDecimals(value, 3) : value);
    setAmount(
      isNaN(`${parseFloat(value) / parseFloat(price)}` as any)
        ? 0
        : parseFloat(`${parseFloat(value) / parseFloat(price)}`).toFixed(3)
    );
  };

  const setAmountValue = (value: any) => {
    setAmount(value.includes(".") ? fixDecimals(value, 3) : value);
    let refinedAmount = value ? parseFloat(value) : 0;
    let total = parseFloat(`${(parseFloat(price) * refinedAmount) as any}`).toFixed(3);
    setTotal(total);
  };

  const setPriceValue = (value: any) => {
    setPrice(value.includes(".") ? fixDecimals(value, 6) : value);
    let refinedAmount = amount ? parseFloat(amount) : 0;
    let total = parseFloat(`${(parseFloat(value) * refinedAmount) as any}`).toFixed(3);
    setTotal(total);
  };

  const getAvailable = (value: string) => value.split(" ")[0];

  const prefillFromBalance = () => {
    if (type === 1) {
      setTotalValue(getAvailable(available));
    } else if (type === 2) {
      setAmountValue(getAvailable(available));
    }
  };

  let totalValue = parseFloat(total);
  const disabled = !(totalValue > 0);

  return loading ? (
    <Skeleton className="loading-hive" />
  ) : (
    <div className={"p-2 " + (isInline ? "flex-1" : "border p-3 rounded")}>
      <div className={"flex justify-between items-center " + (isInline ? "mb-3" : "")}>
        {isInline ? (
          <span className="font-bold">
            {type === 1 ? i18next.t("market.buy") : i18next.t("market.sell")} HIVE
          </span>
        ) : (
          <h3 className="mb-0">
            {type === 1 ? i18next.t("market.buy") : i18next.t("market.sell")} HIVE
          </h3>
        )}
        <div>
          <small className="flex cursor-pointer" onClick={() => prefillFromBalance()}>
            <div className="mr-1 text-blue-dark-sky">{i18next.t("market.available")}:</div>
            <div>{available}</div>
          </small>
          <small className="flex">
            <div className="mr-1 text-blue-dark-sky">
              {type === 1 ? i18next.t("market.lowest-ask") : i18next.t("market.highest-bid")}:
            </div>
            <div onClick={() => onClickPeakValue(basePeakValue.toFixed(3))} className="pointer">
              {basePeakValue.toFixed(3)}
            </div>
          </small>
        </div>
      </div>
      {isInline ? <></> : <hr />}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          setTransaction(
            type === 1 ? BuySellHiveTransactionType.Buy : BuySellHiveTransactionType.Sell
          );
        }}
      >
        <div className="mb-4">
          <label className={isInline ? "font-small" : ""}>{i18next.t("market.price")}</label>
          <InputGroup append="HBD/HIVE">
            <FormControl
              type="text"
              value={price}
              placeholder="0.0"
              onChange={(e) => setPriceValue(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="mb-4">
          <label className={isInline ? "font-small" : ""}>{i18next.t("market.amount")}</label>
          <InputGroup append="HIVE">
            <FormControl
              type="text"
              placeholder="0.0"
              value={isNaN(amount) ? 0 : amount}
              onChange={(e) => setAmountValue(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="mb-4">
          <label className={isInline ? "font-small" : ""}>{i18next.t("market.total")}</label>
          <InputGroup append="HBD">
            <FormControl
              type="text"
              placeholder="0.0"
              value={isNaN(total) ? 0 : total}
              onChange={(e) => setTotalValue(e.target.value)}
            />
          </InputGroup>
        </div>
        <Button className="block" type="submit" disabled={disabled}>
          {type === 1 ? i18next.t("market.buy") : i18next.t("market.sell")}
        </Button>
      </Form>
      {transaction !== BuySellHiveTransactionType.None && (
        <BuySellHiveDialog
          type={transaction}
          onHide={() => setTransaction(BuySellHiveTransactionType.None)}
          onTransactionSuccess={onTransactionSuccess}
          values={{
            total: parseFloat(total),
            amount: parseFloat(amount),
            price: parseFloat(price),
            available: parseFloat(available)
          }}
        />
      )}
    </div>
  );
};
