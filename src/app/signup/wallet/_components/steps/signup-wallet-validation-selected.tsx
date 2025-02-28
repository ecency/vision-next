import { getCoingeckoPriceQuery, getExternalWalletBalanceQuery } from "@/api/queries";
import { ExternalWalletCurrency } from "@/enums";
import { Button } from "@/features/ui";
import { UilCheckCircle, UilClipboardAlt } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import qrcode from "qrcode";
import { useEffect, useMemo, useRef } from "react";
import { useCopyToClipboard, useInterval } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";
import { success } from "@/features/shared";
import clsx from "clsx";

interface Props {
  walletsList: [string, SignupExternalWalletInformation][];
  selected: [ExternalWalletCurrency, string];
  onCancel: () => void;
  onValid: () => void;
}

export function SignupWalletValiadtionSelected({
  walletsList,
  selected,
  onCancel,
  onValid
}: Props) {
  const qrCodeRef = useRef<HTMLImageElement>(null);

  const { data: selectedCurrencyRate } = getCoingeckoPriceQuery(selected?.[0]).useClientQuery();
  const { data: externalWalletBalance, refetch: refetchExternalWalletBalance } =
    getExternalWalletBalanceQuery(selected[0], selected[1]).useClientQuery();

  // todo: restore it
  // const hasValidated = useMemo(
  // () => (externalWalletBalance ?? 0) > (selectedCurrencyRate ?? 1),
  // [externalWalletBalance, selectedCurrencyRate]
  // );
  const hasValidated = true;

  const [_, copy] = useCopyToClipboard();

  useInterval(() => refetchExternalWalletBalance(), 10000);

  useEffect(() => {
    if (selected) {
      qrcode
        .toDataURL(selected[1], { width: 300 })
        .then((src) => qrCodeRef.current && (qrCodeRef.current.src = src));
    }
  }, [selected]);

  useEffect(() => {
    if (hasValidated) {
      onValid();
    }
  }, [hasValidated, onValid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "relative" }}
      transition={{ delay: selected ? 0 : walletsList.length * 0.3 }}
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
          <div className="text-2xl font-bold">
            {selectedCurrencyRate?.toFixed(8)} {CURRENCIES_META_DATA[selected[0]].name}
          </div>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              copy(selected[1]);
              success("Address copied");
            }}
          >
            <div className="opacity-75 text-sm truncate">{selected[1]}</div>
            <Button noPadding={true} icon={<UilClipboardAlt />} appearance="gray-link" size="xxs" />
          </div>
          <div className="-mb-2">Please, topup your wallet to at least $1</div>
          <div className="-mb-2 text-sm opacity-50">
            When your wallet balance will change, We will detect it automatically and let You
            continue account creation
          </div>
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
          We have validated your wallet
        </motion.div>
      )}
    </motion.div>
  );
}
