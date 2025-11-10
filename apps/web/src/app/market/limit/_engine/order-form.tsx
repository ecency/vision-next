import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { FormControl, InputGroup } from "@ui/input";
import Decimal from "decimal.js";
import i18next from "i18next";
import { formattedNumber } from "@/utils";
import { error } from "@/features/shared";

interface Props {
  type: "buy" | "sell";
  symbol: string;
  quoteSymbol: string;
  available: string;
  precision: number;
  bestPrice?: string;
  prefillPrice?: string;
  prefillKey?: number;
  disabled?: boolean;
  onSubmit: (payload: { price: string; quantity: string }) => Promise<void>;
  balanceAction?: ReactNode;
}

const PRICE_DECIMALS = 8;

const clampDecimals = (value: string, decimals: number) => {
  if (!value.includes(".")) {
    return value;
  }

  const [integer, fraction] = value.split(".");
  return `${integer}.${fraction.substring(0, decimals)}`;
};

export const EngineOrderForm = ({
  type,
  symbol,
  quoteSymbol,
  available,
  precision,
  bestPrice,
  prefillPrice,
  prefillKey,
  disabled,
  onSubmit,
  balanceAction
}: Props) => {
  const [price, setPrice] = useState(bestPrice ? clampDecimals(bestPrice, PRICE_DECIMALS) : "");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bestPrice && !price) {
      setPrice(clampDecimals(bestPrice, PRICE_DECIMALS));
    }
  }, [bestPrice, price]);

  useEffect(() => {
    if (prefillPrice !== undefined) {
      setPrice(prefillPrice);
    }
  }, [prefillPrice, prefillKey]);

  const total = useMemo(() => {
    if (!price || !quantity) {
      return "0";
    }

    try {
      return new Decimal(price).mul(new Decimal(quantity)).toFixed(8);
    } catch (e) {
      return "0";
    }
  }, [price, quantity]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isSubmitting) {
      return;
    }

    const priceDecimal = new Decimal(price || 0);
    const quantityDecimal = new Decimal(quantity || 0);

    if (priceDecimal.lte(0) || quantityDecimal.lte(0)) {
      error(i18next.t("market.engine.invalid-order"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        price: priceDecimal.toFixed(8),
        quantity: quantityDecimal.toFixed(precision)
      });
      setQuantity("");
    } catch (err: any) {
      if (err?.message) {
        error(err.message);
      } else {
        error(i18next.t("g.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseBest = () => {
    if (bestPrice) {
      setPrice(clampDecimals(bestPrice, PRICE_DECIMALS));
    }
  };

  const handleUseMax = () => {
    const availableDecimal = new Decimal(available || 0);

    if (type === "sell") {
      setQuantity(clampDecimals(availableDecimal.toFixed(precision), precision));
      return;
    }

    const priceToUse = price || bestPrice;

    if (!priceToUse) {
      return;
    }

    const normalizedPrice = clampDecimals(priceToUse, PRICE_DECIMALS);
    setPrice(normalizedPrice);

    const priceDecimal = new Decimal(normalizedPrice || 0);
    if (priceDecimal.lte(0)) {
      return;
    }

    const maxQuantity = availableDecimal.div(priceDecimal);
    setQuantity(clampDecimals(maxQuantity.toFixed(precision), precision));
  };

  return (
    <Form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border-default p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">
          {type === "buy" ? i18next.t("market.buy") : i18next.t("market.sell")} {symbol}
        </h4>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-text-muted">
          <span>
            {i18next.t("market.available")}: {formattedNumber(available)} {type === "buy" ? quoteSymbol : symbol}
          </span>
          {balanceAction}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleUseBest} disabled={!bestPrice}>
          {i18next.t("market.engine.use-best")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleUseMax}>
          {i18next.t("market.engine.use-max")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{i18next.t("market.engine.price")}</label>
        <InputGroup append={quoteSymbol}>
          <FormControl
            type="text"
            value={price}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, "");
              setPrice(clampDecimals(value, 8));
            }}
            placeholder="0.00000000"
            disabled={disabled || isSubmitting}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{i18next.t("market.engine.amount", { symbol })}</label>
        <InputGroup append={symbol}>
          <FormControl
            type="text"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, "");
              setQuantity(clampDecimals(value, precision));
            }}
            placeholder="0.00000000"
            disabled={disabled || isSubmitting}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{i18next.t("market.engine.total")}</label>
        <InputGroup append={quoteSymbol}>
          <FormControl type="text" value={formattedNumber(total)} readOnly />
        </InputGroup>
      </div>

      <Button type="submit" disabled={disabled || isSubmitting}>
        {type === "buy" ? i18next.t("market.buy") : i18next.t("market.sell")}
      </Button>
    </Form>
  );
};
