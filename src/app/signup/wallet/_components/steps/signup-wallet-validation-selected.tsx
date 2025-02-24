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
      className="my-4 sm:my-6 lg:my-8 xl:my-12 gap-4 items-center grid grid-cols-1 md:grid-cols-2"
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col gap-2 items-start">
          Please, topup your wallet to at least $1
          <Badge className="!text-2xl">
            {selectedCurrencyRate?.toFixed(8)} {CURRENCIES_META_DATA[selected[0]].name}
          </Badge>
        </div>
        <SignupWalletValidationItem
          i={0}
          currency={selected[0]}
          address={selected[1]}
          onSelect={() => {}}
        />
      </div>
      <div className="flex flex-col items-center gap-4 h-full">
        <Image className="rounded-xl" ref={qrCodeRef} src="" width={200} height={200} alt="" />
        <Countdown
          date={Date.now() + 900_000}
          renderer={({ minutes, seconds, completed }) => (
            <div className="flex items-center gap-2 text-4xl font-bold">
              <div>{minutes}</div>
              <div>:</div>
              <div>{seconds}</div>
            </div>
          )}
        />
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
        <Button className="min-w-[200px]" appearance="gray" onClick={onCancel}>
          {i18next.t("g.cancel")}
        </Button>
      </div>
    </motion.div>
  );
}
