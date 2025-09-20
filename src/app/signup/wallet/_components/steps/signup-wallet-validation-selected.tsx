import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import {
  EcencyTokenMetadata,
  EcencyWalletCurrency,
  useGetExternalWalletBalanceQuery
} from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { UilCheckCircle, UilClipboardAlt } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import qrcode from "qrcode";
import { useEffect, useMemo, useRef } from "react";
import { useCopyToClipboard, useInterval } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";

interface Props {
  username: string;
  selected: [EcencyWalletCurrency, string];
  onCancel: () => void;
  onValid: () => void;
}

export function SignupWalletValiadtionSelected({ selected, username, onCancel, onValid }: Props) {
  const qrCodeRef = useRef<HTMLImageElement>(null);

  const { data: wallets } = useQuery<Map<EcencyWalletCurrency, EcencyTokenMetadata>>({
    queryKey: ["ecency-wallets", "wallets", username]
  });
  const walletsList = useMemo(() => Array.from(wallets?.entries() ?? []), [wallets]);
  const { data: externalWalletBalance, refetch: refetchExternalWalletBalance } =
    useGetExternalWalletBalanceQuery(selected[0], selected[1]);

  const hasValidated = useMemo(() => (externalWalletBalance ?? 0) > 0, [externalWalletBalance]);
  //const hasValidated = true;

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
          <div className="text-2xl font-bold">{CURRENCIES_META_DATA[selected[0]].name}</div>
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              copy(selected[1]);
              success(i18next.t("signup-wallets.validate-funds.address-copied"));
            }}
          >
            <div className="opacity-75 text-sm truncate">{selected[1]}</div>
            <Button noPadding={true} icon={<UilClipboardAlt />} appearance="gray-link" size="xxs" />
          </div>
          <div className="-mb-2">{i18next.t("signup-wallets.validate-funds.topup")}</div>
          <div className="-mb-2 text-sm opacity-50">
            {i18next.t("signup-wallets.validate-funds.topup-description")}
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
          {i18next.t("signup-wallets.validate-funds.validation-success")}
        </motion.div>
      )}
    </motion.div>
  );
}
