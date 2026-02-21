import { success } from "@/features/shared";
import { Button, Spinner } from "@/features/ui";
import {
  EcencyWalletCurrency,
  getTokenPriceQueryOptions,
  useGetExternalWalletBalanceQuery,
  useWalletsCacheQuery
} from "@ecency/wallets";
import { UilCheckCircle, UilClipboardAlt } from "@tooni/iconscout-unicons-react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Decimal from "decimal.js";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import qrcode from "qrcode";
import { useEffect, useMemo, useRef } from "react";
import { useCopyToClipboard, useInterval } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";

const DECIMALS_BY_CURRENCY: Partial<Record<EcencyWalletCurrency, number>> = {
  [EcencyWalletCurrency.BTC]: 8,
  [EcencyWalletCurrency.ETH]: 18,
  [EcencyWalletCurrency.BNB]: 18,
  [EcencyWalletCurrency.SOL]: 9,
  [EcencyWalletCurrency.TON]: 9,
  [EcencyWalletCurrency.TRON]: 6,
  [EcencyWalletCurrency.APT]: 8
};

const DECIMALS_BY_UNIT: Record<string, number> = {
  satoshi: 8,
  sat: 8,
  wei: 18,
  lamport: 9,
  lamports: 9,
  sun: 6,
  nanoton: 9,
  nanotons: 9,
  nano: 9,
  octa: 8,
  octas: 8
};

const MINIMUM_VALIDATION_USD = new Decimal(1);

interface Props {
  username: string;
  selected: [EcencyWalletCurrency, string];
  onCancel: () => void;
  onValid: () => void;
}

export function SignupWalletValiadtionSelected({ selected, username, onCancel, onValid }: Props) {
  const qrCodeRef = useRef<HTMLImageElement>(null);
  const [selectedCurrency, selectedAddress] = selected;

  const { data: wallets } = useWalletsCacheQuery(username);
  const walletsList = useMemo(() => Array.from(wallets?.entries() ?? []), [wallets]);
  const {
    data: externalWalletBalance,
    refetch: refetchExternalWalletBalance,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
    isError: isBalanceError
  } = useGetExternalWalletBalanceQuery(selectedCurrency, selectedAddress);

  const {
    data: priceUsd,
    isLoading: isPriceLoading,
    isFetching: isPriceFetching,
    isError: isPriceError
  } = useQuery({
    ...getTokenPriceQueryOptions(selectedCurrency),
    // Cache for a while so we don't refetch alongside the 10s balance poll.
    staleTime: 30000
  });

  const decimals = useMemo(() => {
    if (DECIMALS_BY_CURRENCY[selectedCurrency] !== undefined) {
      return DECIMALS_BY_CURRENCY[selectedCurrency];
    }

    if (externalWalletBalance?.unit) {
      return DECIMALS_BY_UNIT[externalWalletBalance.unit.toLowerCase()];
    }

    return 0;
  }, [externalWalletBalance?.unit, selectedCurrency]);

  const tokenAmount = useMemo(() => {
    const balance = externalWalletBalance?.balanceBigInt ?? 0n;
    const divisor = new Decimal(10).pow(decimals ?? 0);

    return new Decimal(balance.toString()).div(divisor);
  }, [decimals, externalWalletBalance?.balanceBigInt]);

  const hasPrice = typeof priceUsd === "number" && Number.isFinite(priceUsd);
  const usdValue = hasPrice ? tokenAmount.mul(priceUsd) : new Decimal(0);
  const isCheckingBalance = isBalanceLoading || isBalanceFetching;
  const isCheckingPrice = isPriceLoading || isPriceFetching;
  const minimumValidationUsdLabel = new Intl.NumberFormat(i18next.resolvedLanguage ?? "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(MINIMUM_VALIDATION_USD.toNumber());
  const hasValidated = hasPrice && usdValue.greaterThanOrEqualTo(MINIMUM_VALIDATION_USD);
  // const hasValidated = true;

  const [_, copy] = useCopyToClipboard();

  useInterval(() => refetchExternalWalletBalance(), 10000);

  useEffect(() => {
    if (selectedAddress) {
      qrcode
        .toDataURL(selectedAddress, { width: 300 })
        .then((src) => qrCodeRef.current && (qrCodeRef.current.src = src));
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (hasValidated) {
      onValid();
    }
  }, [hasValidated, onValid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "relative" }}
      transition={{ delay: selectedAddress ? 0 : walletsList.length * 0.3 }}
      className="relative my-4 sm:my-6 lg:my-8 xl:my-12"
    >
      <div
        className={clsx(
          "gap-4 md:gap-6 lg:gap-8 xl:gap-12 items-center flex flex-col sm:flex-row duration-300",
          hasValidated && "opacity-20 blur-md"
        )}
      >
        <Image
          className="w-full max-w-[320px] sm:w-auto sm:min-w-[200px] rounded-xl"
          ref={qrCodeRef}
          src=""
          width={200}
          height={200}
          alt=""
        />
        <div className="w-full flex flex-col items-start h-full gap-4">
          <div className="text-2xl font-bold">{CURRENCIES_META_DATA[selectedCurrency].name}</div>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              copy(selectedAddress);
              success(i18next.t("signup-wallets.validate-funds.address-copied"));
            }}
          >
            <div className="opacity-75 text-sm truncate">{selectedAddress}</div>
            <Button noPadding={true} icon={<UilClipboardAlt />} appearance="gray-link" size="xxs" />
          </div>
          <div className="-mb-2">{i18next.t("signup-wallets.validate-funds.topup")}</div>
          <div className="-mb-2 text-sm opacity-50">
            {i18next.t("signup-wallets.validate-funds.topup-description")}
          </div>
          <div className="-mb-2 text-sm opacity-75">At least $1 required to validate.</div>
          {(isCheckingBalance || isCheckingPrice) && (
            <div className="-mb-2 mt-1 text-sm opacity-75 flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              {i18next.t("signup-wallets.validate-funds.checking-balance")}
            </div>
          )}
          {isBalanceError && (
            <div className="-mb-2 text-sm text-red-500">
              {i18next.t("signup-wallets.validate-funds.balance-fetch-error")}
            </div>
          )}
          {hasPrice ? (
            <div className="-mb-2 text-sm opacity-75">
              Estimated value: ${usdValue.toFixed(2)}
            </div>
          ) : !isCheckingPrice ? (
            <div className="-mb-2 text-sm text-orange-500">
              {isPriceError
                ? i18next.t("signup-wallets.validate-funds.price-unavailable")
                : i18next.t("signup-wallets.validate-funds.price-required", {
                    minimum: minimumValidationUsdLabel
                  })}
            </div>
          ) : (
            <></>
          )}
          <Button className="min-w-[200px] mt-4" appearance="gray" onClick={onCancel}>
            {i18next.t("g.cancel")}
          </Button>
        </div>
      </div>

      {hasValidated && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute flex gap-4 items-center justify-center w-full h-full top-0 left-0 text-lg sm:text-xl md:text-2xl font-bold"
        >
          <UilCheckCircle />
          {i18next.t("signup-wallets.validate-funds.validation-success")}
        </motion.div>
      )}
    </motion.div>
  );
}
