import { ExternalWalletCurrency } from "@/enums";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignupExternalWalletInformation } from "../../types";
import { SignupWalletValidationItem } from "./signup-wallet-validation-item";
import Countdown from "react-countdown";
import qrcode from "qrcode";
import Image from "next/image";
import { Button } from "@/features/ui";
import i18next from "i18next";

interface Props {
  wallets: Record<ExternalWalletCurrency, SignupExternalWalletInformation>;
}

export function SignupWalletValidation({ wallets }: Props) {
  const qrCodeRef = useRef<HTMLImageElement>(null);
  // Currency and address
  const [selected, setSelected] = useState<[ExternalWalletCurrency, string]>();

  const walletsList = useMemo(() => Object.entries(wallets), [wallets]);

  useEffect(() => {
    if (selected) {
      qrcode
        .toDataURL(selected[1], { width: 300 })
        .then((src) => qrCodeRef.current && (qrCodeRef.current.src = src));
    }
  }, [selected]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Validate funds</div>
        <div className="opacity-50">
          Topup one of your wallets to make us sure that You are real person
        </div>
      </div>
      <AnimatePresence>
        {!selected && (
          <div className="grid grid-cols-2 sm:grid-col-3 md:grid-cols-4 mt-4 sm:mt-6 lg:mt-8 xl:mt-12 gap-4">
            {walletsList.map(([currency, { address }], index) => (
              <SignupWalletValidationItem
                i={index}
                key={address}
                currency={currency as ExternalWalletCurrency}
                address={address}
                onSelect={() => setSelected([currency as ExternalWalletCurrency, address])}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: walletsList.length * 0.3 }}
            className="my-4 sm:my-6 lg:my-8 xl:my-12 flex flex-col gap-4 items-center"
          >
            <div>
              Please, topup your wallet to <span className="text-blue-dark-sky">0.00003BTC</span>
            </div>
            <Countdown
              date={Date.now() + 900_000}
              renderer={({ minutes, seconds, completed }) => (
                <div className="flex items-center gap-2 text-4xl font-bold text-blue-dark-sky">
                  <div>{minutes}</div>
                  <div>:</div>
                  <div>{seconds}</div>
                </div>
              )}
            />
            <Image
              className="bg-gray-100 dark:bg-dark-default p-4 rounded-xl"
              ref={qrCodeRef}
              src=""
              width={300}
              height={300}
              alt=""
            />
            <Button appearance="gray" onClick={() => setSelected(undefined)}>
              {i18next.t("g.cancel")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
