import React, { useEffect, useMemo, useState } from "react";
import numeral from "numeral";
import i18next from "i18next";

import { FormControl } from "@ui/input";
import { INPUT_DARK_STYLES, INPUT_SIZES, INPUT_STYLES } from "@ui/input/form-controls/input-styles";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { classNameObject } from "@ui/util";

import { MarketAsset } from "./market-pair";

export interface Props {
  className?: string;
  balance?: string;
  value: string;
  setValue: (value: string) => void;
  labelKey: string;
  asset: MarketAsset;
  availableAssets: MarketAsset[];
  setAsset: (asset: MarketAsset) => void;
  usdRate: number;
  disabled: boolean;
  inputDisabled?: boolean;
  selectDisabled?: boolean;
  elementAfterBalance?: JSX.Element;
  showBalance?: boolean;
  hideChevron?: boolean;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9.-]/g, "");

interface AssetSelectorProps {
  asset: MarketAsset;
  availableAssets: MarketAsset[];
  setAsset: (asset: MarketAsset) => void;
  disabled: boolean;
  selectDisabled: boolean;
  hideChevron?: boolean;
}

const AssetSelector = ({
  asset,
  availableAssets,
  setAsset,
  disabled,
  selectDisabled,
  hideChevron
}: AssetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = useMemo(() => normalize(query), [query]);

  const filteredAssets = useMemo(() => {
    if (!normalizedQuery) {
      return availableAssets;
    }

    return availableAssets.filter((item) => normalize(item).includes(normalizedQuery));
  }, [availableAssets, normalizedQuery]);

  const openSelector = () => {
    if (disabled || selectDisabled) {
      return;
    }

    setIsOpen(true);
  };

  const handleSelect = (value: MarketAsset) => {
    setAsset(value);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const triggerClasses = classNameObject({
    [INPUT_STYLES]: true,
    [INPUT_DARK_STYLES]: true,
    [INPUT_SIZES.md]: true,
    "flex items-center justify-between gap-2": true,
    "!w-auto": true,
    "cursor-pointer": !(disabled || selectDisabled),
    "cursor-not-allowed opacity-60": disabled || selectDisabled
  });

  return (
    <>
      <button type="button" className={triggerClasses} onClick={openSelector} disabled={disabled || selectDisabled}>
        <span className="truncate font-semibold">{asset}</span>
        {!hideChevron ? <span className="text-sm opacity-70">▾</span> : null}
      </button>
      <Modal centered show={isOpen} onHide={() => setIsOpen(false)}>
        <ModalHeader closeButton>
          <ModalTitle>
            {i18next.t("market.asset-selector.title", { defaultValue: "Select a token" })}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <FormControl
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                i18next.t("market.asset-selector.search-placeholder", {
                  defaultValue: i18next.t("g.search") ?? "Search"
                })
              }
            />
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {filteredAssets.map((item) => {
                const isSelected = item === asset;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`rounded border px-3 py-2 text-left transition hover:border-border-highlight hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                      isSelected ? "border-border-highlight" : "border-border-default"
                    }`}
                  >
                    <span className="font-semibold">{item}</span>
                  </button>
                );
              })}
              {!filteredAssets.length ? (
                <div className="rounded border border-border-default p-3 text-center text-sm text-text-muted">
                  {i18next.t("g.no-matches")}
                </div>
              ) : null}
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export const SwapAmountControl = ({
  value,
  setValue,
  labelKey,
  asset,
  availableAssets,
  setAsset,
  balance,
  usdRate,
  disabled,
  inputDisabled = false,
  selectDisabled = false,
  className,
  elementAfterBalance,
  showBalance,
  hideChevron
}: Props) => {
  // Format to x,xxx.xxx
  const formatValue = (newValue: string) => {
    const isInt = /[0-9.]*/.test(newValue);
    if (isInt) {
      const isFirstPoint = newValue[0] === ".";
      if (isFirstPoint) {
        return "";
      }

      const isLastPoint = newValue[newValue.length - 1] === ".";
      if (isLastPoint) {
        return newValue;
      }

      const [integerPart, fractionalPart] = newValue.split(".");
      return (
        numeral(integerPart).format("0,0") +
        (fractionalPart ? "." + fractionalPart.slice(0, 3) : "")
      );
    }
    return value;
  };

  return (
    <div
      className={
        "px-3 pt-3 pb-5 lg:px-6 lg:pt-4 lg:pb-8 mb-0 border dark:border-[--border-color] rounded-2xl " +
        className
      }
    >
      <label className="text-xs uppercase opacity-50 font-bold">{i18next.t(labelKey)}</label>
      <div className="flex items-center w-full">
        <div className="w-full">
          <FormControl
            type="text"
            className="amount-control pl-0"
            value={formatValue(value)}
            disabled={disabled || inputDisabled}
            placeholder="0.000"
            onChange={(e) => setValue(formatValue(e.target.value))}
          />
          <small className="usd-balance bold text-gray-600">
            ${formatValue(+value.replace(/,/gm, "") * usdRate + "")}
          </small>
        </div>
        <div className="flex flex-col items-end">
          <AssetSelector
            asset={asset}
            availableAssets={availableAssets}
            disabled={disabled}
            selectDisabled={selectDisabled}
            setAsset={setAsset}
            hideChevron={hideChevron}
          />
          {balance && showBalance ? (
            <small className="balance block text-gray-600 whitespace-nowrap pt-1 pr-1">
              {i18next.t("market.balance")}:
              <span
                className="text-blue-dark-sky font-bold cursor-pointer ml-1"
                onClick={() => (disabled ? null : setValue(balance.split(" ")[0]))}
              >
                {balance}
              </span>
            </small>
          ) : (
            <></>
          )}
        </div>
      </div>
      {elementAfterBalance}
    </div>
  );
};
