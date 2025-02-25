import { motion } from "framer-motion";
import { SignupExternalWalletInformation } from "../../types";
import { ExternalWalletCurrency } from "@/enums";
import { SignupWalletValidationItem } from "./signup-wallet-validation-item";
import { CURRENCIES_META_DATA } from "../../consts";
import { Badge, Button } from "@/features/ui";
import i18next from "i18next";
import Countdown from "react-countdown";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { getCoingeckoPriceQuery } from "@/api/queries";
import qrcode from "qrcode";

interface Props {
  walletsList: [string, SignupExternalWalletInformation][];
  selected: [ExternalWalletCurrency, string];
  onCancel: () => void;
}

export function SignupWalletValiadtionSelected({ walletsList, selected, onCancel }: Props) {
  const qrCodeRef = useRef<HTMLImageElement>(null);
  const { data: selectedCurrencyRate } = getCoingeckoPriceQuery(selected?.[0]).useClientQuery();

  useEffect(() => {
    if (selected) {
      qrcode
        .toDataURL(selected[1], { width: 300 })
        .then((src) => qrCodeRef.current && (qrCodeRef.current.src = src));
    }
  }, [selected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "static" }}
      exit={{ opacity: 0, y: 24, position: "absolute" }}
      transition={{ delay: selected ? 0 : walletsList.length * 0.3 }}
      className="my-4 sm:my-6 lg:my-8 xl:my-12 gap-4 md:gap-6 lg:gap-8 xl:gap-12 items-center flex"
    >
      <Image
        className="min-w-[200px] rounded-xl"
        ref={qrCodeRef}
        src=""
        width={200}
        height={200}
        alt=""
      />
      <div className="w-full flex flex-col items-start h-full gap-4">
        <div className="-mb-2">Please, topup your wallet to at least $1</div>
        <div className="text-2xl font-bold">
          {selectedCurrencyRate?.toFixed(8)} {CURRENCIES_META_DATA[selected[0]].name}
        </div>
        <SignupWalletValidationItem
          i={0}
          currency={selected[0]}
          address={selected[1]}
          onSelect={() => {}}
        />
        <Button className="min-w-[200px]" appearance="gray" onClick={onCancel}>
          {i18next.t("g.cancel")}
        </Button>
      </div>
    </motion.div>
  );
}
